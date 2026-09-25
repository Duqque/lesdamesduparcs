import { authConfigured, safeEqual, setSession } from "@/lib/server/session";
import { json, throttled } from "@/lib/server/http";

/**
 * Comptes de démonstration définis par variables d'environnement (voir .env.example).
 * À remplacer par une vraie base de membres et un hachage de mots de passe pour la production.
 */
const eq = (a: string | undefined, b: string | undefined) => Boolean(a && b) && safeEqual(a!.trim().toLowerCase(), b!.trim().toLowerCase());

export async function POST(req: Request) {
  if (!authConfigured()) return json({ error: "L'authentification n'est pas configurée sur ce serveur." }, 503);
  if (throttled(req, "login")) return json({ error: "Trop de tentatives. Réessayez dans quelques minutes." }, 429);

  const body = (await req.json().catch(() => null)) as { role?: string; memberNumber?: string; email?: string; password?: string } | null;
  if (!body) return json({ error: "Requête invalide." }, 400);
  const invalid = () => json({ error: "Identifiants invalides." }, 401);

  if (body.role === "member") {
    const ok = eq(body.memberNumber, process.env.DEMO_MEMBER_NUMBER) && eq(body.email, process.env.DEMO_MEMBER_EMAIL);
    if (!ok) return invalid();
    const [firstName, ...rest] = (process.env.DEMO_MEMBER_NAME || "Membre").split(" ");
    await setSession({ role: "member", firstName, lastName: rest.join(" "), email: process.env.DEMO_MEMBER_EMAIL!, memberNumber: process.env.DEMO_MEMBER_NUMBER! });
    return json({ ok: true, role: "member" });
  }

  if (body.role === "admin") {
    const ok = eq(body.email, process.env.DEMO_ADMIN_EMAIL) && Boolean(body.password) && safeEqual(body.password!, process.env.DEMO_ADMIN_PASSWORD || "\u0000");
    if (!ok) return invalid();
    await setSession({ role: "admin", firstName: "Administrateur", lastName: "", email: process.env.DEMO_ADMIN_EMAIL! });
    return json({ ok: true, role: "admin" });
  }

  return json({ error: "Requête invalide." }, 400);
}
