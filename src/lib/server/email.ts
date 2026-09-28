import "server-only";
import { emailLog, ensureTemplates, templates } from "./content";
import { settings } from "./admin-store";
import { renderEmail } from "@/lib/email-html";
import { siteOrigin } from "./http";

export const emailConfigured = () => Boolean(process.env.RESEND_API_KEY);

/** Remplace les {{variables}} d'un texte. */
export const fill = (text: string, vars: Record<string, string | number | undefined>) => text.replace(/\{\{(\w+)\}\}/g, (_, k) => String(vars[k] ?? ""));

/**
 * Envoi d'un e-mail via Resend (RESEND_API_KEY, adresse d'expédition dans les paramètres). Sans clé, le message est simplement
 * consigné dans le journal comme « non envoyé » : rien ne part tant qu'un service d'e-mail n'est pas configuré.
 */
async function brandOf() {
  const conf = await settings.get();
  let origin = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "https://www.lesdamesduparc.com";
  try {
    origin = await siteOrigin();
  } catch {
    /* hors requête (tâche planifiée) : adresse configurée */
  }
  const a = conf.association;
  return { conf, origin, brand: { origin, name: a.name || "Les Dames du Parc", address: [a.address, [a.postalCode, a.city].filter(Boolean).join(" ")].filter(Boolean).join(", ") || undefined, email: a.email || undefined, instagram: a.instagram, tiktok: a.tiktok, facebook: a.facebook, signature: conf.emails.signature } };
}

export async function sendEmail(opts: { to: string; subject: string; body: string; kind: string; replyTo?: string; attachments?: Array<{ filename: string; content: Buffer }> }) {
  const { conf, brand } = await brandOf();
  const { html, text } = renderEmail({ subject: opts.subject, body: opts.body, kind: opts.kind, brand });
  if (!emailConfigured()) {
    await emailLog.insert({ to: opts.to, subject: opts.subject, kind: opts.kind, status: "skipped", detail: "Aucun service d'e-mail configuré (RESEND_API_KEY)." });
    return { ok: false as const, skipped: true };
  }
  try {
    const res = await fetch(`${process.env.RESEND_API_URL?.replace(/\/$/, "") || "https://api.resend.com"}/emails`, {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: `${conf.emails.fromName} <${process.env.RESEND_FROM_EMAIL?.trim() || conf.emails.fromEmail}>`, to: [opts.to], subject: opts.subject, html, text, ...((opts.replyTo || process.env.RESEND_REPLY_TO?.trim()) ? { reply_to: opts.replyTo || process.env.RESEND_REPLY_TO!.trim() } : {}), ...(opts.attachments?.length ? { attachments: opts.attachments.map((a) => ({ filename: a.filename, content: a.content.toString("base64") })) } : {}) }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    await emailLog.insert({ to: opts.to, subject: opts.subject, kind: opts.kind, status: "sent" });
    return { ok: true as const };
  } catch (e) {
    await emailLog.insert({ to: opts.to, subject: opts.subject, kind: opts.kind, status: "failed", detail: e instanceof Error ? e.message : "erreur" });
    return { ok: false as const, skipped: false };
  }
}

/** Envoie un modèle (bienvenue, paiement…) si l'automatisation correspondante est activée. */
export async function sendTemplate(key: string, to: string, vars: Record<string, string | number | undefined>, automation?: keyof Awaited<ReturnType<typeof settings.get>>["automations"]) {
  const conf = await settings.get();
  if (automation && !conf.automations[automation]) return;
  await ensureTemplates();
  const t = await templates.findOne((x) => x.key === key);
  if (!t) return;
  await sendEmail({ to, subject: fill(t.subject, vars), body: fill(t.body, vars), kind: key });
}

/**
 * Message de nouveautés adressé à plusieurs adhérentes (un e-mail personnalisé chacune, par lots de 100 chez Resend), avec lien de
 * désabonnement dans le message et en-tête List-Unsubscribe. Sans service d'e-mail, rien ne part : un seul enregistrement « non envoyé ».
 */
export async function sendBulk(
  list: Array<{ email: string; firstName: string; unsubscribeUrl: string }>,
  opts: { subject: string; body: string; kind: string; image?: { src: string; alt: string } },
) {
  if (!list.length) return { sent: 0, failed: 0, skipped: false };
  const { conf, brand } = await brandOf();
  if (!emailConfigured()) {
    await emailLog.insert({ to: `${list.length} destinataire(s)`, subject: opts.subject, kind: opts.kind, status: "skipped", detail: "Aucun service d'e-mail configuré (RESEND_API_KEY)." });
    return { sent: 0, failed: 0, skipped: true };
  }
  let sent = 0;
  let failed = 0;
  for (let i = 0; i < list.length; i += 100) {
    const chunk = list.slice(i, i + 100).map((r) => {
      const vars = { prenom: r.firstName };
      const subject = fill(opts.subject, vars);
      const { html, text } = renderEmail({ subject, body: fill(opts.body, vars), kind: opts.kind, brand, image: opts.image, unsubscribeUrl: r.unsubscribeUrl });
      return {
        from: `${conf.emails.fromName} <${process.env.RESEND_FROM_EMAIL?.trim() || conf.emails.fromEmail}>`,
        to: [r.email],
        subject,
        html,
        text,
        headers: { "List-Unsubscribe": `<${r.unsubscribeUrl}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" },
      };
    });
    try {
      const res = await fetch(`${process.env.RESEND_API_URL?.replace(/\/$/, "") || "https://api.resend.com"}/emails/batch`, { method: "POST", headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" }, body: JSON.stringify(chunk) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      sent += chunk.length;
    } catch {
      failed += chunk.length;
    }
  }
  await emailLog.insert({ to: `${sent} destinataire(s)`, subject: opts.subject, kind: opts.kind, status: failed && !sent ? "failed" : "sent", detail: failed ? `${failed} envoi(s) en échec` : undefined });
  return { sent, failed, skipped: false };
}
