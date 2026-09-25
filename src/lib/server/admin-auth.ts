import "server-only";
import { createHash, createHmac, randomBytes } from "node:crypto";
import { cache } from "react";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { can as roleCan, type Permission } from "@/lib/admin/permissions";
import { hashPassword, verifyPassword } from "./password";
import { safeEqual } from "./session";
import { adminSessions, admins, auditLog, loginEvents, settings, type AdminUser } from "./admin-store";
import { verifyTotp } from "./totp";

export const ADMIN_COOKIE = "ddp_admin";
const ABSOLUTE_MS = 12 * 60 * 60 * 1000;
const secret = () => process.env.AUTH_SECRET || "";
const sign = (v: string) => createHmac("sha256", secret()).update(`admin:${v}`).digest("base64url");
const DUMMY_HASH = hashPassword("dummy-password-1");

export const adminPasswordIssue = (p: string) => (p.length < 10 ? "10 caractères minimum." : !/[A-Za-z]/.test(p) || !/[0-9]/.test(p) ? "Mélangez lettres et chiffres." : "");

export async function requestMeta() {
  const h = await headers();
  return { ip: h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "local", ua: (h.get("user-agent") || "").slice(0, 200) };
}

/** Compte de création : défini par variables d'environnement, créé au premier besoin (le mot de passe n'est jamais stocké en clair). */
export async function ensureSuperAdmin() {
  const email = process.env.SUPERADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.SUPERADMIN_PASSWORD;
  if (!email || !password) return;
  const existing = await admins.findOne((a) => a.email === email);
  if (existing) return;
  const [first = "Administrateur", ...rest] = (process.env.SUPERADMIN_NAME || "Quentin Duquenne").split(" ");
  await admins.insert({
    email, firstName: first, lastName: rest.join(" "), role: "super", passwordHash: hashPassword(password), active: true, totpEnabled: false, knownIps: [],
  });
}

export type LoginResult =
  | { ok: true; stage: "ok" | "mfa"; sessionId: string }
  | { ok: false; error: string; locked?: boolean };

/** Connexion : limitation des tentatives, journalisation, détection d'une adresse inhabituelle. */
export async function loginAdmin(email: string, password: string): Promise<LoginResult> {
  await ensureSuperAdmin();
  const { ip, ua } = await requestMeta();
  const conf = (await settings.get()).security;
  const mail = email.trim().toLowerCase();
  const since = Date.now() - conf.lockoutMin * 60_000;
  const recent = await loginEvents.find((e) => !e.success && new Date(e.createdAt).getTime() > since && (e.email === mail || e.ip === ip));
  if (recent.length >= conf.maxAttempts) {
    await loginEvents.insert({ email: mail, success: false, ip, ua, reason: "verrouillé" });
    return { ok: false, error: `Trop de tentatives. Réessayez dans ${conf.lockoutMin} minutes.`, locked: true };
  }
  const admin = await admins.findOne((a) => a.email === mail);
  const valid = verifyPassword(password, admin?.passwordHash ?? DUMMY_HASH) && Boolean(admin?.active);
  if (!admin || !valid) {
    await loginEvents.insert({ email: mail, success: false, ip, ua, adminId: admin?.id, reason: admin && !admin.active ? "compte désactivé" : "identifiants" });
    return { ok: false, error: "Identifiants invalides." };
  }
  const needMfa = admin.totpEnabled && Boolean(admin.totpSecret);
  const session = await adminSessions.insert({
    adminId: admin.id,
    ip,
    ua,
    stage: needMfa ? "mfa" : "ok",
    lastSeen: new Date().toISOString(),
    expiresAt: new Date(Date.now() + ABSOLUTE_MS).toISOString(),
  });
  if (!needMfa) await finishLogin(admin, ip, ua);
  return { ok: true, stage: session.stage, sessionId: session.id };
}

async function finishLogin(admin: AdminUser, ip: string, ua: string) {
  const unusual = admin.knownIps.length > 0 && !admin.knownIps.includes(ip);
  await loginEvents.insert({ email: admin.email, success: true, ip, ua, adminId: admin.id, reason: unusual ? "nouvelle adresse" : undefined });
  await admins.update(admin.id, { lastLoginAt: new Date().toISOString(), lastLoginIp: ip, knownIps: [...new Set([ip, ...admin.knownIps])].slice(0, 20) });
  await auditLog.insert({ actorId: admin.id, actorName: `${admin.firstName} ${admin.lastName}`.trim(), action: "connexion", entity: "session", label: unusual ? `Connexion depuis une nouvelle adresse (${ip})` : "Connexion", ip });
}

export async function completeMfa(sessionId: string, code: string): Promise<boolean> {
  const session = await adminSessions.get(sessionId);
  if (!session || session.stage !== "mfa") return false;
  const admin = await admins.get(session.adminId);
  if (!admin?.totpSecret || !verifyTotp(admin.totpSecret, code)) {
    const { ip, ua } = await requestMeta();
    await loginEvents.insert({ email: admin?.email ?? "", success: false, ip, ua, adminId: admin?.id, reason: "code 2FA" });
    return false;
  }
  await adminSessions.update(sessionId, { stage: "ok", lastSeen: new Date().toISOString() });
  await finishLogin(admin, session.ip, session.ua);
  return true;
}

export async function setAdminCookie(sessionId: string) {
  const jar = await cookies();
  jar.set(ADMIN_COOKIE, `${sessionId}.${sign(sessionId)}`, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production" && process.env.SESSION_INSECURE_COOKIE !== "1",
    path: "/",
  });
}

export async function clearAdminCookie() {
  const jar = await cookies();
  const raw = jar.get(ADMIN_COOKIE)?.value;
  const id = raw?.split(".")[0];
  if (id) await adminSessions.remove(id);
  jar.delete(ADMIN_COOKIE);
}

export interface AdminContext {
  admin: AdminUser;
  sessionId: string;
  stage: "ok" | "mfa";
  can: (p: Permission) => boolean;
}

/** Administratrice connectée (null sinon). Applique l'expiration par inactivité. Mis en cache pour la durée de la requête. */
export const getAdmin = cache(async (opts?: { allowMfa?: boolean }): Promise<AdminContext | null> => {
  if (secret().length < 24) return null;
  const jar = await cookies();
  const raw = jar.get(ADMIN_COOKIE)?.value;
  if (!raw) return null;
  const [id, sig] = raw.split(".");
  if (!id || !sig || !safeEqual(sig, sign(id))) return null;
  const session = await adminSessions.get(id);
  if (!session) return null;
  const conf = (await settings.get()).security;
  const now = Date.now();
  if (now > new Date(session.expiresAt).getTime() || now - new Date(session.lastSeen).getTime() > conf.sessionTimeoutMin * 60_000) {
    await adminSessions.remove(id);
    return null;
  }
  const admin = await admins.get(session.adminId);
  if (!admin || !admin.active) return null;
  if (session.stage === "mfa" && !opts?.allowMfa) return null;
  if (now - new Date(session.lastSeen).getTime() > 60_000) await adminSessions.update(id, { lastSeen: new Date(now).toISOString() });
  return { admin, sessionId: id, stage: session.stage, can: (p) => roleCan(admin.role, p) };
});

/** À appeler en tête de chaque page et de chaque action : redirige vers la connexion ou l'écran d'accès refusé. */
export async function requireAdmin(perm?: Permission): Promise<AdminContext> {
  const ctx = await getAdmin();
  if (!ctx) redirect("/admin/connexion");
  if (perm && !ctx.can(perm)) redirect("/admin/acces-refuse");
  return ctx;
}

export async function logoutAllSessions(adminId: string) {
  await adminSessions.mutate((rows) => rows.filter((s) => s.adminId !== adminId));
}

export async function audit(ctx: AdminContext, action: string, entity: string, label: string, opts?: { entityId?: string; before?: unknown; after?: unknown }) {
  const { ip } = await requestMeta();
  await auditLog.insert({ actorId: ctx.admin.id, actorName: `${ctx.admin.firstName} ${ctx.admin.lastName}`.trim(), action, entity, label, ip, ...opts });
}

/** Jeton de réinitialisation (à transmettre par la super administratrice tant qu'aucun service d'e-mail n'est configuré). */
export async function createResetToken(adminId: string) {
  const token = randomBytes(24).toString("base64url");
  await admins.update(adminId, { reset: { hash: createHash("sha256").update(token).digest("hex"), exp: Date.now() + 2 * 3600_000 } });
  return token;
}

export async function consumeResetToken(token: string, newPassword: string) {
  const hash = createHash("sha256").update(token).digest("hex");
  const admin = await admins.findOne((a) => a.reset?.hash === hash && (a.reset?.exp ?? 0) > Date.now());
  if (!admin) return false;
  await admins.update(admin.id, { passwordHash: hashPassword(newPassword), reset: undefined, mustChangePassword: false });
  await logoutAllSessions(admin.id);
  return true;
}
