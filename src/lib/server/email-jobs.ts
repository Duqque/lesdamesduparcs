import "server-only";
import { after } from "next/server";
import { eur } from "@/lib/admin/format";
import { formatLongDate } from "@/lib/format";
import { collection, type Row } from "./db";
import { ensureTemplates, templates } from "./content";
import { emailConfigured, fill, sendEmail } from "./email";
import { siteOrigin } from "./http";
import { logEvent } from "./log";

/**
 * File d'e-mails (EmailJob) : un paiement validé ne dépend JAMAIS de l'envoi d'un e-mail. Le paiement est enregistré, l'e-mail est mis
 * en file (une seule fois grâce à la clé d'unicité), puis envoyé par Resend ; en cas d'échec il est retenté avec un délai croissant
 * (jusqu'à 5 essais), et peut être renvoyé à la main depuis l'administration.
 */
export type EmailJobType = "ORDER_CONFIRMATION" | "MEMBERSHIP_CONFIRMATION" | "WELCOME" | "EVENT_CONFIRMATION" | "PAYMENT_FAILED" | "PASSWORD_RESET" | "INVOICE_ISSUED" | "INVOICE_ADMIN";

export interface EmailJob extends Row {
  type: EmailJobType;
  recipient: string;
  /** Clé d'unicité : un même type d'e-mail pour un même objet n'est mis en file qu'une fois */
  dedupeKey: string;
  orderId?: string;
  memberNumber?: string;
  payload: Record<string, unknown>;
  status: "pending" | "sent" | "failed" | "dead";
  attempts: number;
  lastError?: string;
  sentAt?: string;
  nextAttemptAt?: string;
}
export const emailJobs = collection<EmailJob>("email_jobs");

export const MAX_ATTEMPTS = 5;

let chain: Promise<unknown> = Promise.resolve();
const serial = <T>(fn: () => Promise<T>): Promise<T> => {
  const run = chain.then(fn, fn);
  chain = run.catch(() => undefined);
  return run;
};

export function enqueueEmail(job: { type: EmailJobType; recipient: string; dedupeKey: string; orderId?: string; memberNumber?: string; payload: Record<string, unknown> }) {
  return serial(async () => {
    if (!job.recipient) return null;
    const existing = await emailJobs.findOne((j) => j.dedupeKey === job.dedupeKey);
    if (existing) return existing;
    const created = await emailJobs.insert({ ...job, status: "pending", attempts: 0 });
    logEvent("email_queued", { type: job.type, jobId: created.id, orderId: job.orderId });
    return created;
  });
}

const s = (v: unknown) => (typeof v === "string" ? v : v == null ? "" : String(v));
const n = (v: unknown) => (typeof v === "number" ? v : Number(v) || 0);

async function origin() {
  try {
    return await siteOrigin();
  } catch {
    return process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "https://www.lesdamesduparc.com";
  }
}

interface OrderPayload {
  firstName: string;
  orderNumber: string;
  paidAt: string;
  lines: Array<{ name: string; size?: string; qty: number; unitCents: number }>;
  membership?: { planName: string; amountCents: number };
  subtotalCents: number;
  discountCents: number;
  promoCode?: string;
  shippingCents: number;
  totalCents: number;
}

/** Objet et texte de l'e-mail, construits à partir des données enregistrées dans la tâche (aucune relecture nécessaire). */
export async function buildEmail(job: Pick<EmailJob, "type" | "payload">): Promise<{ subject: string; body: string; kind: string; invoiceId?: string; signature?: boolean } | null> {
  const p = job.payload;
  const o = await origin();
  const hello = `Bonjour ${s(p.firstName)},`;
  switch (job.type) {
    case "ORDER_CONFIRMATION": {
      const d = p as unknown as OrderPayload;
      const lines = [
        ...d.lines.map((l) => `${l.qty} × ${l.name}${l.size ? ` (taille ${l.size})` : ""} : ${eur(l.unitCents * l.qty)}`),
        ...(d.membership ? [`1 × ${d.membership.planName} : ${eur(d.membership.amountCents)}`] : []),
      ];
      return {
        kind: "order_confirmation",
        subject: "Votre commande Les Dames du Parc est confirmée",
        body: [
          hello,
          `Merci ! Votre paiement est bien reçu : votre commande n° ${d.orderNumber} du ${formatLongDate(d.paidAt.slice(0, 10))} est confirmée.`,
          `Détail de la commande\n${lines.join("\n")}\n\nSous-total : ${eur(d.subtotalCents)}${d.discountCents ? `\nRéduction${d.promoCode ? ` (code ${d.promoCode})` : ""} : −${eur(d.discountCents)}` : ""}\nLivraison : ${d.shippingCents ? eur(d.shippingCents) : "offerte"}\nTotal payé : ${eur(d.totalCents)}`,
          `Retrouvez vos commandes, votre carte membre et vos factures dans votre espace membre :\n${o}/profil`,
        ].join("\n\n"),
      };
    }
    case "MEMBERSHIP_CONFIRMATION": {
      // Nouvelle adhérente : e-mail de bienvenue modifiable (Communication > Modèles), avec l'invitation au Discord privé.
      if (!p.renewal) {
        await ensureTemplates();
        const t = await templates.findOne((x) => x.key === "membership_welcome");
        if (t) {
          // Plus de lien d'invitation dans l'e-mail : Discord se connecte depuis l'espace membre (adhésion vérifiée à chaque fois).
          const discord = `${o}/profil#espace-prive`;
          const end = s(p.endDate);
          const vars = {
            prenom: s(p.firstName),
            numero: s(p.memberNumber),
            saison: s(p.season),
            saison_courte: s(p.season).replace(/\s*\/\s*/, "–"),
            // L'adhésion court jusqu'à 23h59 le dernier jour ; une durée en mois (horaire quelconque) n'affiche que la date.
            fin: `${new Date(`${end.slice(0, 10)}T12:00:00Z`).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })}${end.slice(10, 19) === "T23:59:59" ? " à 23h59" : ""}`,
            discord,
            espace: `${o}/profil`,
          };
          const withBlock = t.body.replace(/\{\{#discord\}\}([\s\S]*?)\{\{\/discord\}\}/g, (_, inner: string) => (discord ? inner : ""));
          return { kind: "membership_welcome", subject: fill(t.subject, vars), body: fill(withBlock, vars).replace(/\n{3,}/g, "\n\n"), signature: false };
        }
      }
      return {
        kind: "membership_confirmation",
        subject: "Bienvenue chez Les Dames du Parc 💙",
        body: [
          hello,
          `Votre adhésion est confirmée : bienvenue dans le groupe !`,
          `Numéro d'adhérente : ${s(p.memberNumber)}\nSaison : ${s(p.season)}\nValable du ${formatLongDate(s(p.startDate).slice(0, 10))} au ${formatLongDate(s(p.endDate).slice(0, 10))}`,
          `Votre espace membre :\n${o}/profil\n\nVotre carte membre (avec son QR code) :\n${o}/profil#carte`,
        ].join("\n\n"),
      };
    }
    case "WELCOME":
      return { kind: "welcome", subject: "Bienvenue chez Les Dames du Parc", body: [hello, `Votre compte est créé. Retrouvez votre espace membre ici :\n${o}/profil`].join("\n\n") };
    case "EVENT_CONFIRMATION": {
      const practical = Array.isArray(p.practical) ? (p.practical as Array<{ label: string; value: string }>).map((x) => `${x.label} : ${x.value}`).join("\n") : "";
      return {
        kind: "event_confirmation_paid",
        subject: "Votre inscription est confirmée",
        body: [
          hello,
          `Votre inscription à « ${s(p.eventTitle)} » est confirmée.`,
          `Date : ${formatLongDate(s(p.date).slice(0, 10))}${p.time ? `, ${s(p.time)}` : ""}\nLieu : ${s(p.venue)}${p.address ? `, ${s(p.address)}` : ""}\nPlaces : ${n(p.places) || 1}${n(p.amountCents) ? `\nMontant réglé : ${eur(n(p.amountCents))}` : ""}`,
          ...(practical ? [`Informations pratiques\n${practical}`] : []),
          `Votre billet et vos inscriptions :\n${o}/profil`,
        ].join("\n\n"),
      };
    }
    case "PAYMENT_FAILED":
      return {
        kind: "payment_failed",
        subject: "Votre paiement n'a pas abouti",
        body: [hello, `Le paiement de votre commande n° ${s(p.orderNumber)} n'a pas abouti. Aucun montant n'a été débité pour cette tentative.`, `Vous pouvez réessayer sans recomposer votre panier :\n${o}${s(p.retryPath)}`].join("\n\n"),
      };
    case "INVOICE_ISSUED":
    case "INVOICE_ADMIN": {
      // Validation du paiement avec la facture en pièce jointe : modèles modifiables (Communication > Modèles).
      const key = job.type === "INVOICE_ISSUED" ? "invoice_issued" : "invoice_admin";
      await ensureTemplates();
      const t = await templates.findOne((x) => x.key === key);
      if (!t) return null;
      const vars = (p.vars ?? {}) as Record<string, string | number>;
      return { kind: key, subject: fill(t.subject, vars), body: fill(t.body, vars), invoiceId: s(p.invoiceId) };
    }
    case "PASSWORD_RESET":
      return null;
  }
}

/** Envoie les e-mails en attente (et retente ceux en échec) ; chaque échec est consigné, un e-mail n'est jamais envoyé deux fois. */
export function processEmailJobs(limit = 25) {
  return serial(async () => {
    const now = Date.now();
    const due = (await emailJobs.find((j) => (j.status === "pending" || j.status === "failed") && (!j.nextAttemptAt || new Date(j.nextAttemptAt).getTime() <= now))).slice(0, limit);
    let sent = 0;
    for (const job of due) {
      if (!emailConfigured()) break; // sans service d'e-mail : les tâches restent en attente et partiront dès qu'il sera configuré
      const mail = await buildEmail(job);
      if (!mail) {
        await emailJobs.update(job.id, { status: "dead", lastError: "Type d'e-mail sans modèle." });
        continue;
      }
      let attachments: Array<{ filename: string; content: Buffer }> | undefined;
      if (mail.invoiceId) {
        const { invoiceKey, invoices } = await import("./invoice");
        const inv = await invoices.findOne((i) => i.id === mail.invoiceId);
        const blob = inv ? await (await import("./blobs")).getBlob(invoiceKey(inv.id)) : null;
        if (inv && blob) attachments = [{ filename: `facture-${inv.number}.pdf`, content: blob.bytes }];
      }
      const res = await sendEmail({ to: job.recipient, subject: mail.subject, body: mail.body, kind: mail.kind, attachments, signature: mail.signature });
      if (res.ok) {
        await emailJobs.update(job.id, { status: "sent", sentAt: new Date().toISOString(), attempts: job.attempts + 1, lastError: undefined });
        logEvent("email_sent", { type: job.type, jobId: job.id });
        sent++;
      } else {
        const attempts = job.attempts + 1;
        await emailJobs.update(job.id, {
          status: attempts >= MAX_ATTEMPTS ? "dead" : "failed",
          attempts,
          lastError: "Échec de l'envoi (voir le journal des e-mails).",
          nextAttemptAt: new Date(Date.now() + 5 * 60_000 * 2 ** (attempts - 1)).toISOString(),
        });
        logEvent("email_failed", { type: job.type, jobId: job.id, attempts }, "warn");
      }
    }
    return sent;
  });
}

/** Lance l'envoi juste après la réponse HTTP (sans retarder la validation du paiement). */
export function processEmailJobsSoon() {
  try {
    after(() => processEmailJobs().catch(() => undefined));
  } catch {
    void processEmailJobs().catch(() => undefined);
  }
}

/** Remet une tâche en file (renvoi manuel depuis l'administration) et tente l'envoi immédiatement. */
export async function resendEmailJob(id: string) {
  await emailJobs.update(id, { status: "pending", attempts: 0, nextAttemptAt: undefined, lastError: undefined });
  return processEmailJobs(1);
}
