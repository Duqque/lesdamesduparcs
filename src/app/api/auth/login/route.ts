import { authConfigured, setSession } from "@/lib/server/session";
import { json, throttled, tooMany, readJson } from "@/lib/server/http";
import { dummyHash, hashPassword, needsRehash, verifyPassword } from "@/lib/server/password";
import { findMemberByLogin, updateMember } from "@/lib/server/store";

/**
 * Membres : comptes créés via le formulaire d'adhésion (mot de passe haché avec scrypt).
 * Les administratrices se connectent sur /admin/connexion (sessions séparées).
 */

export async function POST(req: Request) {
  if (!(await authConfigured())) return json({ error: "L'authentification n'est pas disponible sur ce serveur." }, 503);
  if (await throttled(req, "login", 15)) return tooMany();

  const body = await readJson<{ role?: string; memberNumber?: string; email?: string; password?: string }>(req);
  if (!body || typeof body !== "object") return json({ error: "Requête invalide." }, 400);
  const invalid = () => json({ error: "Identifiants invalides." }, 401);

  if (body.role === "member") {
    const login = String(body.memberNumber || body.email || "").trim().slice(0, 160);
    const password = typeof body.password === "string" ? body.password.slice(0, 200) : "";
    // Limite par compte en plus de la limite par adresse : freine le « credential stuffing » réparti sur plusieurs IP.
    if (login && (await throttled(req, "login-compte", 10, 900_000, login.toLowerCase()))) return tooMany();
    const member = login && password ? await findMemberByLogin(login) : null;
    // Vérification exécutée même si le compte n'existe pas, pour ne pas révéler quelles adresses sont inscrites.
    const ok = await verifyPassword(password, member?.passwordHash || (await dummyHash()));
    if (!member || !ok || member.status === "anonymized") return invalid();
    if (needsRehash(member.passwordHash)) await updateMember(member.id, { passwordHash: await hashPassword(password) });
    await setSession(member.id);
    return json({ ok: true, role: "member" });
  }

  return json({ error: "Requête invalide." }, 400);
}
