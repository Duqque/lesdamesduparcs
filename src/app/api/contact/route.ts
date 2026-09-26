import { json, readJson, throttled, tooMany } from "@/lib/server/http";
import { sendEmail } from "@/lib/server/email";
import { settings } from "@/lib/server/admin-store";
import { contactMessages } from "@/lib/server/content";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE = /^[+0-9][0-9 .()-]{7,19}$/;
/** Retire tout saut de ligne / caractère de contrôle (injection d'en-têtes d'e-mail) et borne la longueur. */
const line = (v: unknown, max: number) => String(v ?? "").replace(/[\u0000-\u001f\u007f\u2028\u2029]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);

/**
 * Formulaire de contact du site. Le message est enregistré dans l'administration ET envoyé par e-mail à l'association
 * (objet « Contact Site Web | Prénom Nom », réponse directe possible à la personne). Un accusé de réception est envoyé à la personne.
 */
export async function POST(req: Request) {
  if (await throttled(req, "contact", 4, 600_000)) return tooMany();
  const body = await readJson<Record<string, unknown>>(req, 16 * 1024);
  if (!body) return json({ error: "Requête invalide." }, 400);
  // Champ piège invisible : un robot le remplit, une personne jamais. Réponse identique pour ne rien lui apprendre.
  if (String(body.website ?? "").trim()) return json({ ok: true });

  const firstName = line(body.firstName, 80);
  const lastName = line(body.lastName, 80);
  const email = line(body.email, 160).toLowerCase();
  const phone = line(body.phone, 24);
  const message = String(body.message ?? "").replace(/\u0000/g, "").trim().slice(0, 4000);
  const errors: Record<string, string> = {};
  if (!firstName) errors.firstName = "Prénom requis.";
  if (!lastName) errors.lastName = "Nom requis.";
  if (!EMAIL.test(email)) errors.email = "Adresse e-mail invalide.";
  if (!PHONE.test(phone)) errors.phone = "Numéro de téléphone invalide.";
  if (message.length < 10) errors.message = "Votre message est trop court (10 caractères minimum).";
  if (Object.keys(errors).length) return json({ error: "Certains champs sont à corriger.", errors }, 422);
  if (await throttled(req, "contact-mail", 5, 86_400_000, email)) return tooMany();

  const conf = await settings.get();
  const to = conf.association.email || "contact@lesdamesduparc.com";
  const full = `${firstName} ${lastName}`;
  const sent = await sendEmail({
    to,
    subject: `Contact Site Web | ${full}`,
    body: `Nouveau message reçu depuis le formulaire de contact du site.\n\nNom : ${lastName}\nPrénom : ${firstName}\nE-mail : ${email}\nTéléphone : ${phone}\n\nMessage :\n${message}\n\n(Vous pouvez répondre directement à ce message : la réponse sera envoyée à ${email}.)`,
    kind: "contact",
    replyTo: email,
  });
  const row = await contactMessages.insert({ firstName, lastName, email, phone, message, status: "new", delivered: sent.ok });
  // Accusé de réception à la personne (validation de la prise de contact).
  await sendEmail({
    to: email,
    subject: "Nous avons bien reçu votre message | Les Dames du Parc",
    body: `Bonjour ${firstName},\n\nMerci d'avoir contacté Les Dames du Parc. Votre message a bien été reçu et nous vous répondrons dès que possible.\n\nRécapitulatif de votre message :\n« ${message} »\n\nSi vous n'êtes pas à l'origine de cette demande, ignorez simplement ce message.`,
    kind: "contact-accuse",
  });
  return json({ ok: true, id: row.id });
}
