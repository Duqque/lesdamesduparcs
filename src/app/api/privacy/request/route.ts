import { createHash, randomBytes } from "node:crypto";
import { json, readJson, siteUrl, throttled, tooMany } from "@/lib/server/http";
import { sendEmail } from "@/lib/server/email";
import { PRIVACY_TYPE_LABEL, dueDate, privacyRequests, type PrivacyType } from "@/lib/server/privacy";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * Demande d'exercice de droits (RGPD), ouverte à tous. La réponse est toujours la même (aucune information sur l'existence d'un compte).
 * Un lien de confirmation est envoyé à l'adresse indiquée : la demande n'est traitée qu'une fois l'adresse confirmée.
 */
export async function POST(req: Request) {
  if (await throttled(req, "privacy", 5, 3_600_000)) return tooMany();
  const body = await readJson<{ name?: string; email?: string; type?: string; message?: string }>(req, 16 * 1024);
  const name = String(body?.name ?? "").trim().slice(0, 120);
  const email = String(body?.email ?? "").trim().toLowerCase().slice(0, 160);
  const type = String(body?.type ?? "") as PrivacyType;
  const message = String(body?.message ?? "").trim().slice(0, 2000);
  if (!name || !EMAIL.test(email) || !(type in PRIVACY_TYPE_LABEL)) return json({ error: "Indiquez votre nom, une adresse e-mail valide et le type de demande." }, 422);
  if (await throttled(req, "privacy-mail", 3, 86_400_000, email)) return tooMany();

  const token = randomBytes(24).toString("base64url");
  await privacyRequests.insert({ type, name, email, message, status: "received", verified: false, tokenHash: createHash("sha256").update(token).digest("hex"), dueAt: dueDate() });
  await sendEmail({
    to: email,
    subject: "Confirmez votre demande concernant vos données personnelles",
    body: `Bonjour ${name},\n\nNous avons bien reçu votre demande : ${PRIVACY_TYPE_LABEL[type]}.\n\nPour confirmer qu'elle émane bien de vous, ouvrez ce lien et cliquez sur « Confirmer » :\n${siteUrl(req)}/mes-donnees/confirmer/${token}\n\nSi vous n'êtes pas à l'origine de cette demande, ignorez simplement ce message.\nNous vous répondrons dans un délai d'un mois maximum.`,
    kind: "rgpd",
  });
  return json({ ok: true });
}
