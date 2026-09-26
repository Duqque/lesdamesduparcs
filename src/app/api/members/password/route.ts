import { json, readJson, throttled, tooMany } from "@/lib/server/http";
import { hashPassword, verifyPassword } from "@/lib/server/password";
import { getSession, revokeMemberSessions, setSession } from "@/lib/server/session";
import { getMemberByNumber, updateMember } from "@/lib/server/store";
import { passwordIssue } from "@/lib/members";

/**
 * Changement de mot de passe de la membre connectée : exige l'ancien mot de passe, ferme TOUTES les sessions (autres appareils
 * compris) puis rouvre une session neuve sur cet appareil.
 */
export async function POST(req: Request) {
  const s = await getSession();
  if (s?.role !== "member") return json({ error: "Non connectée." }, 401);
  if (await throttled(req, "password", 8, 900_000, s.memberNumber)) return tooMany();
  const body = await readJson<{ current?: string; next?: string }>(req);
  const current = typeof body?.current === "string" ? body.current.slice(0, 200) : "";
  const next = typeof body?.next === "string" ? body.next.slice(0, 200) : "";
  const member = await getMemberByNumber(s.memberNumber);
  if (!member || !current || !(await verifyPassword(current, member.passwordHash))) return json({ error: "Mot de passe actuel incorrect." }, 403);
  const issue = passwordIssue(next);
  if (issue) return json({ error: issue }, 422);
  await updateMember(member.id, { passwordHash: await hashPassword(next) });
  await revokeMemberSessions(member.id);
  await setSession(member.id);
  return json({ ok: true });
}
