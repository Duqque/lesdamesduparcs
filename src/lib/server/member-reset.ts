import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { hashPassword } from "./password";
import { revokeMemberSessions } from "./session";
import { listStoredMembers, updateMember } from "./store";

/** Lien à usage unique pour définir ou réinitialiser son mot de passe : jeton aléatoire, seule son empreinte est conservée. */
export async function createMemberResetToken(memberId: string, ttlMs = 2 * 3600_000) {
  const token = randomBytes(24).toString("base64url");
  await updateMember(memberId, { reset: { hash: createHash("sha256").update(token).digest("hex"), exp: Date.now() + ttlMs } });
  return token;
}

export async function consumeMemberResetToken(token: string, newPassword: string) {
  const hash = createHash("sha256").update(token).digest("hex");
  const member = (await listStoredMembers()).find((m) => m.reset?.hash === hash && (m.reset?.exp ?? 0) > Date.now() && m.status !== "anonymized");
  if (!member) return false;
  await updateMember(member.id, { passwordHash: await hashPassword(newPassword), reset: undefined });
  await revokeMemberSessions(member.id);
  return true;
}
