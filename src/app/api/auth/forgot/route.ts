import { json, readJson, siteUrl, throttled, tooMany } from "@/lib/server/http";
import { sendEmail } from "@/lib/server/email";
import { createMemberResetToken } from "@/lib/server/member-reset";
import { findMemberByLogin } from "@/lib/server/store";

/** « Mot de passe oublié » : la réponse est toujours identique, que l'adresse existe ou non. */
export async function POST(req: Request) {
  if (await throttled(req, "forgot", 5, 3_600_000)) return tooMany();
  const body = await readJson<{ email?: string }>(req, 4 * 1024);
  const email = String(body?.email ?? "").trim().toLowerCase().slice(0, 160);
  if (email && (await throttled(req, "forgot-mail", 3, 3_600_000, email))) return tooMany();
  const member = email ? await findMemberByLogin(email) : null;
  if (member && member.status !== "anonymized") {
    const token = await createMemberResetToken(member.id);
    await sendEmail({
      to: member.email,
      subject: "Définir votre mot de passe",
      body: `Bonjour ${member.firstName},\n\nPour définir ou réinitialiser le mot de passe de votre espace membre, ouvrez ce lien (valable 2 heures, à usage unique) :\n${siteUrl(req)}/connexion/reinitialiser/${token}\n\nSi vous n'êtes pas à l'origine de cette demande, ignorez ce message : votre mot de passe reste inchangé.`,
      kind: "mot-de-passe",
    });
  }
  return json({ ok: true });
}
