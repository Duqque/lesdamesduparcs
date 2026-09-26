import { json } from "@/lib/server/http";
import { clearSession, getSession, revokeMemberSessions } from "@/lib/server/session";
import { getMemberByNumber } from "@/lib/server/store";

/** Déconnecte la membre de tous ses appareils. */
export async function POST() {
  const s = await getSession();
  if (s?.role !== "member") return json({ error: "Non connectée." }, 401);
  const member = await getMemberByNumber(s.memberNumber);
  if (member) await revokeMemberSessions(member.id);
  await clearSession();
  return json({ ok: true });
}
