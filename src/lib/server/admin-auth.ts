import "server-only";
import { createHash, createHmac, randomBytes } from "node:crypto";
import { cache } from "react";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { can as roleCan, type Permission } from "@/lib/admin/permissions";
import { dummyHash, hashPassword, needsRehash, verifyPassword } from "./password";
import { safeEqual } from "./session";
import { adminSessions, admins, auditLog, loginEvents, settings, type AdminUser } from "./admin-store";
import { verifyTotpStep } from "./totp";
import { authSecret, loadAuthSecret } from "./auth-secret";
import { clientIp } from "./http";

const INSECURE = process.env.SESSION_INSECURE_COOKIE === "1" || process.env.NODE_ENV !== "production";
/** Préfixe __Host- : cookie refusé s'il n'est pas Secure, ou posé depuis un sous-domaine. */
export const ADMIN_COOKIE = INSECURE ? "ddp_admin" : "__Host-ddp_admin";
const ABSOLUTE_MS = 12 * 60 * 60 * 1000;
const secret = () => authSecret();
const sign = (v: string) => createHmac("sha256", secret()).update(`admin:${v}`).digest("base64url");

export const adminPasswordIssue = (p: string) => (p.length < 10 ? "10 caractères minimum." : !/[A-Za-z]/.test(p) || !/[0-9]/.test(p) ? "Mélangez lettres et chiffres." : "");

export async function requestMeta() {
  const h = await headers();
  return { ip: clientIp(h), ua: (h.get("user-agent") || "").slice(0, 200) };
}

/**
 * Compte du créateur du site, fourni avec le code : créé au premier lancement (rôle « super », tous les accès).
 * Seul le hachage scrypt du mot de passe figure dans le code. Les variables SUPERADMIN_EMAIL / SUPERADMIN_PASSWORD /
 * SUPERADMIN_NAME, si elles sont définies, le remplacent. Un compte déjà créé n'est jamais écrasé.
 */
const FOUNDER = {
  email: "contact@quentinduquenne.fr",
  name: "Quentin Duquenne",
  passwordHash: "scrypt$SnjMGhYEwoqQtwjE838W5g$0KwhBN8i3nLglFs7E7YW0y8bjWz7JdSG9kNk2u3R-TH__YGfLXkGXCB0xghjU_CwAS9MXFFNbvplr_UfBiyEmA",
};

export async function ensureSuperAdmin() {
  const envEmail = process.env.SUPERADMIN_EMAIL?.trim().toLowerCase();
  const envPassword = process.env.SUPERADMIN_PASSWORD;
  const custom = Boolean(envEmail && envPassword);
  const email = custom ? envEmail! : FOUNDER.email;
  const existing = await admins.findOne((a) => a.email === email);
  if (existing) return;
  const [first = "Administrateur", ...rest] = (custom ? process.env.SUPERADMIN_NAME || FOUNDER.name : FOUNDER.name).split(" ");
  await admins.insert({
    email, firstName: first, lastName: rest.join(" "), role: "super", passwordHash: custom ? await hashPassword(envPassword!) : FOUNDER.passwordHash, active: true, totpEnabled: false, knownIps: [],
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
  // Verrouillage progressif : même compte depuis la même adresse (seuil normal), une même adresse sur tous les comptes
  // (×3) ou un même compte attaqué depuis plusieurs adresses (×4). Évite qu'un tiers puisse bloquer durablement une administratrice.
  const sameBoth = recent.filter((e) => e.email === mail && e.ip === ip).length;
  const sameIp = recent.filter((e) => e.ip === ip).length;
  const sameMail = recent.filter((e) => e.email === mail).length;
  if (sameBoth >= conf.maxAttempts || sameIp >= conf.maxAttempts * 3 || sameMail >= conf.maxAttempts * 4) {
    await loginEvents.insert({ email: mail, success: false, ip, ua, reason: "verrouillé" });
    return { ok: false, error: `Trop de tentatives. Réessayez dans ${conf.lockoutMin} minutes.`, locked: true };
  }
  const admin = await admins.findOne((a) => a.email === mail);
  const valid = (await verifyPassword(password, admin?.passwordHash || (await dummyHash()))) && Boolean(admin?.active);
  if (!admin || !valid) {
    await loginEvents.insert({ email: mail, success: false, ip, ua, adminId: admin?.id, reason: admin && !admin.active ? "compte désactivé" : "identifiants" });
    return { ok: false, error: "Identifiants invalides." };
  }
  if (needsRehash(admin.passwordHash)) await admins.update(admin.id, { passwordHash: await hashPassword(password) });
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

const hashCode = (c: string) => createHash("sha256").update(c.trim().toLowerCase().replace(/[\s-]/g, "")).digest("hex");

/** Génère 8 codes de secours à usage unique : renvoie les codes en clair (à afficher une seule fois) et leurs empreintes. */
export function newRecoveryCodes() {
  const codes = Array.from({ length: 8 }, () => {
    const h = randomBytes(5).toString("hex");
    return `${h.slice(0, 5)}-${h.slice(5)}`;
  });
  return { codes, hashes: codes.map(hashCode) };
}

/**
 * Contrôle d'un second facteur : code TOTP (rejeu refusé) ou code de secours (usage unique, consommé).
 * Après 5 échecs en 15 minutes, le compte n'accepte plus de code jusqu'à la fin de la fenêtre.
 */
export async function checkSecondFactor(admin: AdminUser, input: string): Promise<boolean> {
  const since = Date.now() - 15 * 60_000;
  const failures = await loginEvents.find((e) => !e.success && e.adminId === admin.id && e.reason === "code 2FA" && new Date(e.createdAt).getTime() > since);
  const { ip, ua } = await requestMeta();
  if (failures.length >= 5) return false;
  const fail = async () => {
    await loginEvents.insert({ email: admin.email, success: false, ip, ua, adminId: admin.id, reason: "code 2FA" });
    return false;
  };
  const clean = input.trim();
  if (/^\d{3}\s?\d{3}$/.test(clean) && admin.totpSecret) {
    const step = verifyTotpStep(admin.totpSecret, clean);
    if (step === null || step <= (admin.lastTotpStep ?? 0)) return fail();
    await admins.update(admin.id, { lastTotpStep: step });
    return true;
  }
  const h = hashCode(clean);
  if (clean.length >= 10 && admin.recoveryCodes?.includes(h)) {
    await admins.update(admin.id, { recoveryCodes: admin.recoveryCodes.filter((x) => x !== h) });
    await auditLog.insert({ actorId: admin.id, actorName: `${admin.firstName} ${admin.lastName}`.trim(), action: "sécurité", entity: "compte", label: "Code de secours utilisé", ip });
    return true;
  }
  return fail();
}

export async function completeMfa(sessionId: string, code: string): Promise<boolean> {
  const session = await adminSessions.get(sessionId);
  if (!session || session.stage !== "mfa") return false;
  const admin = await admins.get(session.adminId);
  if (!admin?.totpSecret || !(await checkSecondFactor(admin, code))) return false;
  await adminSessions.update(sessionId, { stage: "ok", lastSeen: new Date().toISOString(), reauthAt: new Date().toISOString() });
  await finishLogin(admin, session.ip, session.ua);
  return true;
}

export async function setAdminCookie(sessionId: string) {
  await loadAuthSecret();
  const jar = await cookies();
  jar.set(ADMIN_COOKIE, `${sessionId}.${sign(sessionId)}`, {
    httpOnly: true,
    sameSite: "strict",
    secure: !INSECURE,
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
  /** Double authentification exigée mais pas encore configurée : seul l'écran « Mon compte » est accessible. */
  limited: boolean;
  reauthAt?: string;
}

/** Administratrice connectée (null sinon). Applique l'expiration par inactivité. Mis en cache pour la durée de la requête. */
export const getAdmin = cache(async (opts?: { allowMfa?: boolean }): Promise<AdminContext | null> => {
  await loadAuthSecret();
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
  const limited = conf.require2fa !== false && !(admin.totpEnabled && admin.totpSecret);
  return { admin, sessionId: id, stage: session.stage, limited, reauthAt: session.reauthAt, can: (p) => !limited && roleCan(admin.role, p) };
});

/** À appeler en tête de chaque page et de chaque action : redirige vers la connexion ou l'écran d'accès refusé. */
export async function requireAdmin(perm?: Permission, opts?: { allowLimited?: boolean }): Promise<AdminContext> {
  const ctx = await getAdmin();
  if (!ctx) redirect("/admin/connexion");
  if (ctx.limited && !opts?.allowLimited) redirect("/admin/compte?erreur=" + encodeURIComponent("Activez la double authentification pour accéder à l'administration."));
  if (perm && !ctx.can(perm)) redirect("/admin/acces-refuse");
  return ctx;
}

const FRESH_MS = 10 * 60_000;
export const isFresh = (ctx: AdminContext) => Boolean(ctx.reauthAt && Date.now() - new Date(ctx.reauthAt).getTime() < FRESH_MS);

/** Chemin interne d'administration sûr (évite toute redirection ouverte). */
export const safeAdminPath = (p: string | null | undefined) => (p && /^\/admin(\/[A-Za-z0-9_\-./%?=&,+:@]*)?$/.test(p) && !p.includes("//") ? p : "/admin");

/**
 * Actions sensibles (exports, comptes administrateurs, remboursements, suppressions…) : exigent une confirmation d'identité
 * (mot de passe + code) datant de moins de 10 minutes. Redirige vers l'écran de confirmation sinon.
 */
export async function requireFresh(ctx: AdminContext, returnTo?: string): Promise<void> {
  if (isFresh(ctx)) return;
  let next = returnTo;
  if (!next) {
    const ref = (await headers()).get("referer");
    try {
      next = ref ? new URL(ref).pathname + new URL(ref).search : "/admin";
    } catch {
      next = "/admin";
    }
  }
  redirect(`/admin/verification-identite?next=${encodeURIComponent(safeAdminPath(next))}`);
}

export async function confirmIdentity(ctx: AdminContext, password: string, code: string): Promise<boolean> {
  const { ip } = await requestMeta();
  const since = Date.now() - 15 * 60_000;
  const failures = await loginEvents.find((e) => !e.success && e.adminId === ctx.admin.id && e.reason === "identité" && new Date(e.createdAt).getTime() > since);
  if (failures.length >= 5) return false;
  const ok = (await verifyPassword(password, ctx.admin.passwordHash)) && (await checkSecondFactor(ctx.admin, code));
  if (!ok) {
    await loginEvents.insert({ email: ctx.admin.email, success: false, ip, ua: "", adminId: ctx.admin.id, reason: "identité" });
    return false;
  }
  await adminSessions.update(ctx.sessionId, { reauthAt: new Date().toISOString() });
  await audit(ctx, "sécurité", "session", "Identité confirmée pour une action sensible");
  return true;
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
  await admins.update(admin.id, { passwordHash: await hashPassword(newPassword), reset: undefined, mustChangePassword: false });
  await logoutAllSessions(admin.id);
  return true;
}
