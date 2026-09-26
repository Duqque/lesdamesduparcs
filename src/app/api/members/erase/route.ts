import { json, readJson, throttled, tooMany } from "@/lib/server/http";
import { verifyPassword } from "@/lib/server/password";
import { clearSession, getSession } from "@/lib/server/session";
import { getMemberByNumber } from "@/lib/server/store";
import { eraseMemberData } from "@/lib/server/privacy";
import { auditLog } from "@/lib/server/admin-store";

/**
 * Droit à l'effacement : la membre supprime elle-même son compte. Exige son mot de passe et la saisie du mot SUPPRIMER.
 * Les données personnelles sont effacées partout ; seules les pièces comptables sont conservées, sans lien avec elle.
 */
export async function POST(req: Request) {
  const s = await getSession();
  if (s?.role !== "member") return json({ error: "Non connectée." }, 401);
  if (await throttled(req, "erase", 5, 900_000, s.memberNumber)) return tooMany();
  const body = await readJson<{ password?: string; confirm?: string }>(req);
  const member = await getMemberByNumber(s.memberNumber);
  if (!member || String(body?.confirm ?? "").trim().toUpperCase() !== "SUPPRIMER") return json({ error: "Saisissez le mot SUPPRIMER pour confirmer." }, 422);
  if (!(await verifyPassword(String(body?.password ?? "").slice(0, 200), member.passwordHash))) return json({ error: "Mot de passe incorrect." }, 403);
  const summary = await eraseMemberData(member.id);
  await auditLog.insert({ actorId: "self", actorName: "Adhérente (demande d'effacement)", action: "effacement", entity: "adhérente", label: `Compte effacé à la demande de la personne (${member.id.slice(0, 8)})`, ip: "" });
  await clearSession();
  return json({ ok: true, summary });
}
