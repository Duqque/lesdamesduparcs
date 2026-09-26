import "server-only";
import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies, headers } from "next/headers";
import { authSecret, loadAuthSecret } from "./auth-secret";
import { collection } from "./db";
import { clientIp } from "./http";
import { getMemberById } from "./store";

/**
 * Sessions des adhérentes : stockées côté serveur (base de données), révocables.
 * Le navigateur ne reçoit qu'un identifiant aléatoire signé dans un cookie HttpOnly / Secure / SameSite ;
 * la base ne conserve que l'empreinte SHA-256 de cet identifiant.
 */
const INSECURE = process.env.SESSION_INSECURE_COOKIE === "1" || process.env.NODE_ENV !== "production";
/** Le préfixe __Host- interdit tout cookie posé depuis un sous-domaine ou en clair (fixation de session). */
export const SESSION_COOKIE = INSECURE ? "ddp_session" : "__Host-ddp_session";
const IDLE_MS = 24 * 60 * 60 * 1000;
const ABSOLUTE_MS = 7 * 24 * 60 * 60 * 1000;

export type SessionUser =
  | { role: "member"; firstName: string; lastName: string; email: string; memberNumber: string }
  | { role: "admin"; firstName: string; lastName: string; email: string };

interface MemberSession {
  id: string;
  createdAt: string;
  updatedAt: string;
  memberId: string;
  ip: string;
  ua: string;
  lastSeen: string;
  expiresAt: string;
}
const sessions = collection<MemberSession>("member_sessions");

const digest = (v: string) => createHash("sha256").update(v).digest("hex");
const b64 = (s: Buffer) => s.toString("base64url");
const sign = (data: string) => createHmac("sha256", authSecret()).update(`member:${data}`).digest("base64url");

export const authConfigured = async () => (await loadAuthSecret()).length >= 24;

export function safeEqual(a: string, b: string) {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}

const cookieOptions = () => ({
  httpOnly: true,
  sameSite: "lax" as const,
  secure: !INSECURE,
  path: "/",
});

export async function getSession(): Promise<SessionUser | null> {
  await loadAuthSecret();
  const raw = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!raw) return null;
  const [id, sig] = raw.split(".");
  if (!id || !sig || !safeEqual(sig, sign(id))) return null;
  const key = digest(id);
  const session = await sessions.get(key);
  if (!session) return null;
  const now = Date.now();
  if (now > new Date(session.expiresAt).getTime() || now - new Date(session.lastSeen).getTime() > IDLE_MS) {
    await sessions.remove(key);
    return null;
  }
  const member = await getMemberById(session.memberId);
  if (!member || member.status === "anonymized" || !member.passwordHash) {
    await sessions.remove(key);
    return null;
  }
  if (now - new Date(session.lastSeen).getTime() > 5 * 60_000) await sessions.update(key, { lastSeen: new Date(now).toISOString() });
  return { role: "member", firstName: member.firstName, lastName: member.lastName, email: member.email, memberNumber: member.memberNumber };
}

/** Ouvre une session pour l'adhérente `memberId` (un nouvel identifiant à chaque connexion : pas de fixation de session). */
export async function setSession(memberId: string) {
  await loadAuthSecret();
  const id = b64(randomBytes(32));
  const h = await headers();
  const now = Date.now();
  await sessions.insert({
    id: digest(id),
    memberId,
    ip: clientIp(h),
    ua: (h.get("user-agent") ?? "").slice(0, 200),
    lastSeen: new Date(now).toISOString(),
    expiresAt: new Date(now + ABSOLUTE_MS).toISOString(),
  });
  (await cookies()).set(SESSION_COOKIE, `${id}.${sign(id)}`, { ...cookieOptions(), maxAge: ABSOLUTE_MS / 1000 });
}

export async function clearSession() {
  const jar = await cookies();
  const id = jar.get(SESSION_COOKIE)?.value.split(".")[0];
  if (id) await sessions.remove(digest(id));
  jar.delete(SESSION_COOKIE);
}

/** Déconnecte tous les appareils d'une adhérente (changement de mot de passe, compte compromis, anonymisation). */
export async function revokeMemberSessions(memberId: string) {
  await sessions.mutate((rows) => rows.filter((s) => s.memberId !== memberId));
}

/** Supprime les sessions expirées (appelé par la tâche planifiée). */
export async function purgeMemberSessions() {
  const now = Date.now();
  await sessions.mutate((rows) => rows.filter((s) => now < new Date(s.expiresAt).getTime() && now - new Date(s.lastSeen).getTime() < IDLE_MS));
}
