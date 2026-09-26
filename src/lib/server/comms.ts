import { housekeeping } from "./maintenance";
import { reconcilePending } from "./payments";
import "server-only";
import { formatLongDate } from "@/lib/format";
import { eur } from "@/lib/admin/format";
import { loadMemberRows, type MemberRow } from "./admin-data";
import { settings } from "./admin-store";
import { campaigns, emailLog, templates, type Campaign } from "./content";
import { collection, type Row } from "./db";
import { emailConfigured, fill, sendTemplate } from "./email";
import { getAllEventsAdmin } from "./events";
import { listAllRegistrations, listOrders } from "./store";
import { plans, setTxStatus } from "./business";

export const SEGMENTS = [
  { key: "all", label: "Toutes les adhérentes actives" },
  { key: "new", label: "Nouvelles adhérentes (30 jours)" },
  { key: "participants", label: "Participantes à un événement" },
  { key: "expired", label: "Adhésions expirées" },
] as const;

export async function segmentOptions() {
  const p = await plans.all();
  return [...SEGMENTS.map((s) => ({ key: s.key as string, label: s.label })), ...p.map((x) => ({ key: `plan:${x.id}`, label: `Formule : ${x.name}` }))];
}

/** Destinataires (adresses uniques) d'une campagne, d'après les segments choisis. */
export async function recipientsFor(audience: string[]) {
  const rows = (await loadMemberRows()).filter((r) => r.status !== "anonymized");
  const regs = await listAllRegistrations();
  const participants = new Set(regs.filter((r) => r.status !== "cancelled" && r.status !== "refunded" && r.status !== "waitlist").map((r) => r.memberNumber));
  const since = Date.now() - 30 * 86_400_000;
  const match = (r: MemberRow, key: string) =>
    key === "all" ? r.status === "active" :
    key === "new" ? new Date(r.joinedAt).getTime() >= since :
    key === "participants" ? participants.has(r.member.memberNumber) :
    key === "expired" ? r.status === "expired" :
    key.startsWith("plan:") ? r.membership?.planId === key.slice(5) && r.status === "active" : false;
  const out = new Map<string, { email: string; firstName: string }>();
  for (const r of rows) if (audience.some((k) => match(r, k))) out.set(r.member.email, { email: r.member.email, firstName: r.member.firstName });
  return [...out.values()];
}

async function sendBatch(list: Array<{ email: string; firstName: string }>, subject: string, body: string, button?: { label?: string; url?: string }) {
  const conf = await settings.get();
  const extra = button?.label && button.url ? `\n\n${button.label} : ${button.url}` : "";
  let sent = 0;
  for (let i = 0; i < list.length; i += 100) {
    const chunk = list.slice(i, i + 100).map((r) => ({
      from: `${conf.emails.fromName} <${conf.emails.fromEmail}>`,
      to: [r.email],
      subject: fill(subject, { prenom: r.firstName }),
      text: fill(body, { prenom: r.firstName }) + extra + (conf.emails.signature ? `\n\n${conf.emails.signature}` : ""),
    }));
    const res = await fetch("https://api.resend.com/emails/batch", { method: "POST", headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" }, body: JSON.stringify(chunk) });
    if (!res.ok) throw new Error(`Resend HTTP ${res.status}`);
    sent += chunk.length;
  }
  return sent;
}

/** Envoie une campagne. Sans service d'e-mail configuré, elle reste « en file d'attente » : rien n'est envoyé. */
export async function dispatchCampaign(c: Campaign) {
  const list = await recipientsFor(c.audience);
  if (!emailConfigured()) {
    await campaigns.update(c.id, { status: "queued", recipients: list.length, note: "Aucun service d'e-mail configuré (RESEND_API_KEY) : la campagne n'est pas partie." });
    return { sent: 0, queued: true, total: list.length };
  }
  try {
    const sent = await sendBatch(list, c.subject, c.body, { label: c.buttonLabel, url: c.buttonUrl });
    await campaigns.update(c.id, { status: "sent", sentAt: new Date().toISOString(), recipients: sent, note: undefined });
    await emailLog.insert({ to: `${sent} destinataire(s)`, subject: c.subject, kind: "campagne", status: "sent" });
    return { sent, queued: false, total: list.length };
  } catch (e) {
    await campaigns.update(c.id, { status: "queued", note: `Échec de l'envoi : ${e instanceof Error ? e.message : "erreur"}` });
    await emailLog.insert({ to: `${list.length} destinataire(s)`, subject: c.subject, kind: "campagne", status: "failed" });
    return { sent: 0, queued: true, total: list.length };
  }
}

/* ---------- Automatisations planifiées ---------- */

interface AutoLog extends Row {
  key: string;
}
const autoLog = collection<AutoLog>("automation_log");
const once = async (key: string) => {
  if (await autoLog.findOne((x) => x.key === key)) return false;
  await autoLog.insert({ key });
  return true;
};

/** Traite ce qui est dû : campagnes programmées, rappels de renouvellement (J-30, J-7), rappels d'événements (J-7, J-1). */
export async function runScheduled() {
  const now = new Date();
  await housekeeping().catch(() => undefined);
  await reconcilePending().catch(() => undefined);
  const result = { campaigns: 0, renewals: 0, reminders: 0, releasedOrders: 0 };
  // Commandes jamais réglées : au bout de 72 h, le stock réservé est remis en vente.
  for (const o of await listOrders()) {
    if (o.status === "awaiting_payment" && o.checkoutId && now.getTime() - new Date(o.createdAt).getTime() > 72 * 3600_000) {
      await setTxStatus(`order:${o.id}`, "cancelled");
      result.releasedOrders++;
    }
  }
  for (const c of await campaigns.find((x) => x.status === "scheduled" && !!x.scheduledAt && new Date(x.scheduledAt) <= now)) {
    await dispatchCampaign(c);
    result.campaigns++;
  }
  const conf = await settings.get();
  const rows = await loadMemberRows();
  for (const r of rows) {
    if (r.status !== "active" || !r.expiresAt) continue;
    const days = Math.ceil((new Date(r.expiresAt).getTime() - now.getTime()) / 86_400_000);
    for (const [limit, flag] of [[30, "renewalJ30"], [7, "renewalJ7"]] as const) {
      if (days <= limit && days > (limit === 30 ? 7 : 0) && conf.automations[flag] && (await once(`renewal:${r.membership?.id}:${limit}`))) {
        await sendTemplate("renewal", r.member.email, { prenom: r.member.firstName, fin: formatLongDate(r.expiresAt.slice(0, 10)) });
        result.renewals++;
      }
    }
  }
  const [events, regs] = await Promise.all([getAllEventsAdmin(), listAllRegistrations()]);
  for (const e of events) {
    const days = Math.ceil((new Date(`${e.date}T12:00:00Z`).getTime() - now.getTime()) / 86_400_000);
    for (const [limit, flag] of [[7, "eventReminderJ7"], [1, "eventReminderJ1"]] as const) {
      if (days !== limit || !conf.automations[flag]) continue;
      for (const r of regs.filter((x) => x.eventId === e.id && (x.status === "paid" || x.status === "confirmed"))) {
        if (await once(`event:${r.id}:${limit}`)) {
          await sendTemplate("event_reminder", r.email, { prenom: r.firstName, objet: e.title, date: formatLongDate(e.date) });
          result.reminders++;
        }
      }
    }
  }
  return result;
}

let lastTick = 0;
/** Déclenchement opportuniste (au plus toutes les 10 minutes) depuis le back-office ; un cron externe peut appeler /api/cron/tick. */
export async function maybeTick() {
  if (Date.now() - lastTick < 600_000) return;
  lastTick = Date.now();
  await runScheduled().catch(() => undefined);
}

export { eur, templates };
