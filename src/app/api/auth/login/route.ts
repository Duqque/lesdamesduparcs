import { authConfigured, setSession } from "@/lib/server/session";
import { json, throttled } from "@/lib/server/http";
import { hashPassword, verifyPassword } from "@/lib/server/password";
import { findMemberByLogin } from "@/lib/server/store";

const DUMMY_HASH = hashPassword("dummy-password-1");

/**
 * Membres : comptes créés via le formulaire d'adhésion (mot de passe haché avec scrypt).
 * Les administratrices se connectent sur /admin/connexion (sessions séparées).
 */

export async function POST(req: Request) {
  if (!authConfigured()) return json({ error: "L'authentification n'est pas configurée sur ce serveur." }, 503);
  if (throttled(req, "login")) return json({ error: "Trop de tentatives. Réessayez dans quelques minutes." }, 429);

  const body = (await req.json().catch(() => null)) as { role?: string; memberNumber?: string; email?: string; password?: string } | null;
  if (!body) return json({ error: "Requête invalide." }, 400);
  const invalid = () => json({ error: "Identifiants invalides." }, 401);

  if (body.role === "member") {
    const login = (body.memberNumber || body.email || "").trim();
    const member = login && body.password ? await findMemberByLogin(login) : null;
    // Vérification exécutée même si le compte n'existe pas, pour ne pas révéler quelles adresses sont inscrites.
    const ok = verifyPassword(body.password || "", member?.passwordHash ?? DUMMY_HASH);
    if (!member || !ok) return invalid();
    await setSession({ role: "member", firstName: member.firstName, lastName: member.lastName, email: member.email, memberNumber: member.memberNumber });
    return json({ ok: true, role: "member" });
  }

  return json({ error: "Requête invalide." }, 400);
}
