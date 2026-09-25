"use server";

import { redirect } from "next/navigation";
import { adminPasswordIssue, audit, logoutAllSessions, requireAdmin } from "@/lib/server/admin-auth";
import { adminSessions, admins } from "@/lib/server/admin-store";
import { hashPassword, verifyPassword } from "@/lib/server/password";
import { generateSecret, verifyTotp } from "@/lib/server/totp";

const s = (f: FormData, k: string) => String(f.get(k) ?? "");
function back(kind: "ok" | "erreur", msg: string): never {
  redirect(`/admin/compte?${kind}=${encodeURIComponent(msg)}`);
}

export async function changePasswordAction(formData: FormData) {
  const ctx = await requireAdmin();
  const current = s(formData, "current");
  const next = s(formData, "next");
  if (!verifyPassword(current, ctx.admin.passwordHash)) back("erreur", "Mot de passe actuel incorrect.");
  const issue = adminPasswordIssue(next);
  if (issue) back("erreur", issue);
  if (next !== s(formData, "confirm")) back("erreur", "Les mots de passe ne correspondent pas.");
  await admins.update(ctx.admin.id, { passwordHash: hashPassword(next), mustChangePassword: false });
  // Les autres sessions sont fermées ; celle-ci est conservée.
  await adminSessions.mutate((rows) => rows.filter((x) => x.adminId !== ctx.admin.id || x.id === ctx.sessionId));
  await audit(ctx, "sécurité", "compte", "Mot de passe modifié");
  back("ok", "Mot de passe modifié. Vos autres sessions ont été fermées.");
}

export async function startTotpAction() {
  const ctx = await requireAdmin();
  await admins.update(ctx.admin.id, { totpSecret: generateSecret(), totpEnabled: false });
  back("ok", "Scannez le QR code avec votre application d'authentification, puis saisissez le code pour activer.");
}

export async function enableTotpAction(formData: FormData) {
  const ctx = await requireAdmin();
  if (!ctx.admin.totpSecret || !verifyTotp(ctx.admin.totpSecret, s(formData, "code"))) back("erreur", "Code invalide : réessayez.");
  await admins.update(ctx.admin.id, { totpEnabled: true });
  await audit(ctx, "sécurité", "compte", "Double authentification activée");
  back("ok", "Double authentification activée.");
}

export async function disableTotpAction(formData: FormData) {
  const ctx = await requireAdmin();
  if (!verifyPassword(s(formData, "password"), ctx.admin.passwordHash)) back("erreur", "Mot de passe incorrect.");
  await admins.update(ctx.admin.id, { totpEnabled: false, totpSecret: undefined });
  await audit(ctx, "sécurité", "compte", "Double authentification désactivée");
  back("ok", "Double authentification désactivée.");
}

export async function logoutAllAction() {
  const ctx = await requireAdmin();
  await logoutAllSessions(ctx.admin.id);
  await audit(ctx, "sécurité", "compte", "Déconnexion de toutes les sessions");
  redirect("/admin/connexion");
}
