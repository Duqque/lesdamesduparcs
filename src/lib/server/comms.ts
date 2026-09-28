import { housekeeping } from "./maintenance";
import { reconcilePending } from "./payments";
import "server-only";
import { formatLongDate } from "@/lib/format";
import { eur } from "@/lib/admin/format";
import { loadMemberRows, type MemberRow } from "./admin-data";
import { settings } from "./admin-store";
import { campaigns, emailLog, templates, type Campaign } from "./content";
import { collection, type Row } from "./db";
import { emailConfigured, sendBulk, sendTemplate } from "./email";
import { siteOrigin } from "./http";
import { unsubscribeToken } from "./unsubscribe";
import { getAllEventsAdmin } from "./events";
import { listAllRegistrations, listOrders } from "./store";
import { plans, reinstateDue, setTxStatus } from "./business";
import { notifyNewContent } from "./notify";
import { processEmailJobs } from "./email-jobs";

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
  // Les personnes qui se sont désabonnées des e-mails de nouveautés ne reçoivent pas non plus les campagnes.
  const out = new Map<string, { id: string; email: string; firstName: string }>();
  for (const r of rows) if (r.member.emailUpdates !== false && audience.some((k) => match(r, k))) out.set(r.member.email, { id: r.member.id, email: r.member.email, firstName: r.member.firstName });
  return [...out.values()];
}

/** Envoi HTML d'une campagne : un e-mail personnalisé par personne, photo d'en-tête, photos, liens (boutons), désabonnement inclus. */
async function sendCampaign(list: Array<{ id: string; email: string; firstName: string }>, c: Campaign) {
  let origin = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "https://www.lesdamesduparc.com";
  try {
    origin = await siteOrigin();
  } catch {
    /* tâche planifiée : adresse configurée */
  }
  const abs = (u: string) => (u.startsWith("/") ? `${origin}${u}` : u);
  const withUnsub = await Promise.all(list.map(async (r) => ({ email: r.email, firstName: r.firstName, unsubscribeUrl: `${origin}/desabonnement?t=${encodeURIComponent(await unsubscribeToken(r.id))}` })));
  return sendBulk(withUnsub, {
    subject: c.subject,
    body: c.body,
    kind: "campagne",
    image: c.imageUrl ? { src: abs(c.imageUrl), alt: c.imageAlt || c.subject } : undefined,
    extraImages: (c.extraImages ?? []).map((u) => ({ src: abs(u), alt: c.subject })),
    links: (c.links ?? []).map((l) => ({ label: l.label, url: abs(l.url) })),
    cta: c.buttonLabel && c.buttonUrl ? { label: c.buttonLabel, url: abs(c.buttonUrl) } : undefined,
  });
}

/** Envoie une campagne. Sans service d'e-mail configuré, elle reste « en file d'attente » : rien n'est envoyé. */
export async function dispatchCampaign(c: Campaign) {
  const list = await recipientsFor(c.audience);
  if (!emailConfigured()) {
    await campaigns.update(c.id, { status: "queued", recipients: list.length, note: "Aucun service d'e-mail configuré (RESEND_API_KEY) : la campagne n'est pas partie." });
    return { sent: 0, queued: true, total: list.length };
  }
  try {
    const res = await sendCampaign(list, c);
    if (res.failed && !res.sent) throw new Error("Échec de l'envoi");
    const sent = res.sent;
    await campaigns.update(c.id, { status: "sent", sentAt: new Date().toISOString(), recipients: sent, note: undefined });
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
  await reinstateDue(true).catch(() => 0);
  // E-mails de paiement en attente ou en échec : envoi et nouvelles tentatives.
  await processEmailJobs().catch(() => 0);
  const result = { campaigns: 0, renewals: 0, reminders: 0, releasedOrders: 0, announced: 0 };
  // Publications programmées arrivées à échéance : annonce aux adhérentes (une seule fois par élément).
  result.announced = (await notifyNewContent().catch(() => ({ announced: 0 }))).announced;
  // Commandes jamais réglées : au bout de 72 h, le stock réservé est remis en vente.
  for (const o of await listOrders()) {
    if ((o.status === "awaiting_payment" || o.status === "failed") && o.checkoutId && now.getTime() - new Date(o.createdAt).getTime() > 72 * 3600_000) {
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
  // Adhésion toujours non réglée ou non validée 7 et 15 jours après la création : rappel automatique avec le lien de paiement.
  if (conf.automations.paymentReminderJ7 || conf.automations.paymentReminderJ15) {
    const { payments: pays, membershipState } = await import("./business");
    const { getMemberByNumber } = await import("./store");
    const { siteOrigin } = await import("./http");
    let origin = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "https://www.lesdamesduparc.com";
    try {
      origin = await siteOrigin();
    } catch {
      /* tâche planifiée : adresse configurée */
    }
    for (const pay of await pays.find((p) => p.kind === "adhesion" && p.status === "pending" && !p.viaOrderId && p.amountCents > 0)) {
      const days = Math.floor((now.getTime() - new Date(pay.createdAt).getTime()) / 86_400_000);
      const due: 7 | 15 | null = days >= 15 && conf.automations.paymentReminderJ15 && pay.reminderSent !== 15 ? 15 : days >= 7 && conf.automations.paymentReminderJ7 && !pay.reminderSent ? 7 : null;
      if (!due) continue;
      const member = pay.memberNumber ? await getMemberByNumber(pay.memberNumber) : null;
      if (!member || member.status === "anonymized" || member.status === "expelled" || member.status === "suspended" || (await membershipState(member.id)) !== "pending") continue;
      await sendTemplate("payment_reminder", member.email, { prenom: member.firstName, jours: due, montant: eur(pay.amountCents), lien: `${origin}/rejoindre-le-groupe/paiement` });
      await pays.update(pay.id, { reminderSent: due });
      result.reminders++;
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
