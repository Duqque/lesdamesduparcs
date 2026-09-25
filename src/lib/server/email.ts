import "server-only";
import { emailLog, templates } from "./content";
import { settings } from "./admin-store";

export const emailConfigured = () => Boolean(process.env.RESEND_API_KEY);

/** Remplace les {{variables}} d'un texte. */
export const fill = (text: string, vars: Record<string, string | number | undefined>) => text.replace(/\{\{(\w+)\}\}/g, (_, k) => String(vars[k] ?? ""));

/**
 * Envoi d'un e-mail via Resend (RESEND_API_KEY, adresse d'expédition dans les paramètres). Sans clé, le message est simplement
 * consigné dans le journal comme « non envoyé » : rien ne part tant qu'un service d'e-mail n'est pas configuré.
 */
export async function sendEmail(opts: { to: string; subject: string; body: string; kind: string }) {
  const conf = await settings.get();
  const signature = conf.emails.signature ? `\n\n${conf.emails.signature}` : "";
  if (!emailConfigured()) {
    await emailLog.insert({ to: opts.to, subject: opts.subject, kind: opts.kind, status: "skipped", detail: "Aucun service d'e-mail configuré (RESEND_API_KEY)." });
    return { ok: false as const, skipped: true };
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: `${conf.emails.fromName} <${conf.emails.fromEmail}>`, to: [opts.to], subject: opts.subject, text: opts.body + signature }),
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
  const t = await templates.findOne((x) => x.key === key);
  if (!t) return;
  await sendEmail({ to, subject: fill(t.subject, vars), body: fill(t.body, vars), kind: key });
}
