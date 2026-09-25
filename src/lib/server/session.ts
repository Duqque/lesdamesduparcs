import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const SESSION_COOKIE = "ddp_session";
const MAX_AGE_S = 60 * 60 * 8;

export type SessionUser =
  | { role: "member"; firstName: string; lastName: string; email: string; memberNumber: string }
  | { role: "admin"; firstName: string; lastName: string; email: string };

type Payload = SessionUser & { exp: number };

const secret = () => process.env.AUTH_SECRET || "";
export const authConfigured = () => secret().length >= 24;

const b64 = (s: string) => Buffer.from(s).toString("base64url");
const sign = (data: string) => createHmac("sha256", secret()).update(data).digest("base64url");

export function safeEqual(a: string, b: string) {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}

export function createToken(user: SessionUser) {
  const payload: Payload = { ...user, exp: Math.floor(Date.now() / 1000) + MAX_AGE_S };
  const body = b64(JSON.stringify(payload));
  return `${body}.${sign(body)}`;
}

function readToken(token: string | undefined): SessionUser | null {
  if (!token || !authConfigured()) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig || !safeEqual(sig, sign(body))) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString()) as Payload;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    const { exp: _exp, ...user } = payload;
    void _exp;
    return user;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionUser | null> {
  const jar = await cookies();
  return readToken(jar.get(SESSION_COOKIE)?.value);
}

export async function setSession(user: SessionUser) {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, createToken(user), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production" && process.env.SESSION_INSECURE_COOKIE !== "1",
    path: "/",
    maxAge: MAX_AGE_S,
  });
}

export async function clearSession() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}
