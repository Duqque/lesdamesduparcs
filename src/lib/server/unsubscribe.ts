import "server-only";
import { createHmac } from "node:crypto";
import { authSecret, loadAuthSecret as ensureAuthSecret } from "./auth-secret";
import { safeEqual } from "./session";
import { getMemberById, updateMember } from "./store";

/** Lien de désabonnement des e-mails de nouveautés : identifiant de la membre signé (HMAC), sans connexion nécessaire. */
const sign = (id: string) => createHmac("sha256", authSecret()).update(`unsub:${id}`).digest("base64url").slice(0, 32);

export async function unsubscribeToken(memberId: string) {
  await ensureAuthSecret();
  return `${memberId}.${sign(memberId)}`;
}

export async function memberFromUnsubscribeToken(token: string) {
  await ensureAuthSecret();
  const [id, sig] = token.split(".");
  if (!id || !sig || !safeEqual(sig, sign(id))) return null;
  return getMemberById(id);
}

/** Enregistre le désabonnement (ou le réabonnement). Renvoie le prénom pour la page de confirmation, null si le lien est invalide. */
export async function setEmailUpdates(token: string, on: boolean) {
  const m = await memberFromUnsubscribeToken(token);
  if (!m || m.status === "anonymized") return null;
  await updateMember(m.id, { emailUpdates: on });
  return { firstName: m.firstName };
}
