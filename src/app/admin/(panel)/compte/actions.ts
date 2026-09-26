"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { adminPasswordIssue, audit, logoutAllSessions, newRecoveryCodes, requireAdmin } from "@/lib/server/admin-auth";
import { adminSessions, admins, settings } from "@/lib/server/admin-store";
import { hashPassword, verifyPassword } from "@/lib/server/password";
import { generateSecret, verifyTotpStep } from "@/lib/server/totp";

const s = (f: FormData, k: string) => String(f.get(k) ?? "");
function back(kind: "ok" | "erreur", msg: string): never {
  redirect(`/admin/compte?${kind}=${encodeURIComponent(msg)}`);
}

/** Codes de secours : affichés une seule fois, via un cookie de 60 secondes limité à cette page. */
async function flashCodes(codes: string[]) {
  (await cookies()).set("ddp_admin_codes", codes.join(" "), { httpOnly: true, sameSite: "strict", path: "/admin/compte", maxAge: 60, secure: process.env.NODE_ENV === "production" && process.env.SESSION_INSECURE_COOKIE !== "1" });
}

export async function changePasswordAction(formData: FormData) {
  const ctx = await requireAdmin(undefined, { allowLimited: true });
  const current = s(formData, "current");
  const next = s(formData, "next");
  if (!(await verifyPassword(current, ctx.admin.passwordHash))) back("erreur", "Mot de passe actuel incorrect.");
  const issue = adminPasswordIssue(next);
  if (issue) back("erreur", issue);
  if (next !== s(formData, "confirm")) back("erreur", "Les mots de passe ne correspondent pas.");
  await admins.update(ctx.admin.id, { passwordHash: await hashPassword(next), mustChangePassword: false });
  // Les autres sessions sont fermées ; celle-ci est conservée.
  await adminSessions.mutate((rows) => rows.filter((x) => x.adminId !== ctx.admin.id || x.id === ctx.sessionId));
  await audit(ctx, "sécurité", "compte", "Mot de passe modifié");
  back("ok", "Mot de passe modifié. Vos autres sessions ont été fermées.");
}

export async function startTotpAction() {
  const ctx = await requireAdmin(undefined, { allowLimited: true });
  await admins.update(ctx.admin.id, { totpSecret: generateSecret(), totpEnabled: false });
  back("ok", "Scannez le QR code avec votre application d'authentification, puis saisissez le code pour activer.");
}

export async function enableTotpAction(formData: FormData) {
  const ctx = await requireAdmin(undefined, { allowLimited: true });
  const step = ctx.admin.totpSecret ? verifyTotpStep(ctx.admin.totpSecret, s(formData, "code")) : null;
  if (step === null) back("erreur", "Code invalide : réessayez.");
  const { codes, hashes } = newRecoveryCodes();
  await admins.update(ctx.admin.id, { totpEnabled: true, lastTotpStep: step, recoveryCodes: hashes });
  await audit(ctx, "sécurité", "compte", "Double authentification activée");
  await flashCodes(codes);
  back("ok", "Double authentification activée. Conservez vos codes de secours ci-dessous.");
}

export async function regenerateCodesAction(formData: FormData) {
  const ctx = await requireAdmin(undefined, { allowLimited: true });
  if (!(await verifyPassword(s(formData, "password"), ctx.admin.passwordHash))) back("erreur", "Mot de passe incorrect.");
  const { codes, hashes } = newRecoveryCodes();
  await admins.update(ctx.admin.id, { recoveryCodes: hashes });
  await audit(ctx, "sécurité", "compte", "Codes de secours régénérés");
  await flashCodes(codes);
  back("ok", "Nouveaux codes de secours générés : les précédents ne fonctionnent plus.");
}

export async function disableTotpAction(formData: FormData) {
  const ctx = await requireAdmin(undefined, { allowLimited: true });
  if ((await settings.get()).security.require2fa !== false) back("erreur", "La double authentification est obligatoire pour toutes les administratrices.");
  if (!(await verifyPassword(s(formData, "password"), ctx.admin.passwordHash))) back("erreur", "Mot de passe incorrect.");
  await admins.update(ctx.admin.id, { totpEnabled: false, totpSecret: undefined, recoveryCodes: undefined });
  await audit(ctx, "sécurité", "compte", "Double authentification désactivée");
  back("ok", "Double authentification désactivée.");
}

export async function logoutAllAction() {
  const ctx = await requireAdmin(undefined, { allowLimited: true });
  await logoutAllSessions(ctx.admin.id);
  await audit(ctx, "sécurité", "compte", "Déconnexion de toutes les sessions");
  redirect("/admin/connexion");
}
