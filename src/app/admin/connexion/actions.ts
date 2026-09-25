"use server";

import { redirect } from "next/navigation";
import { adminPasswordIssue, clearAdminCookie, completeMfa, consumeResetToken, getAdmin, loginAdmin, requestMeta, setAdminCookie } from "@/lib/server/admin-auth";
import { admins, resetRequests } from "@/lib/server/admin-store";

export interface FormState {
  error?: string;
  ok?: string;
}

export async function loginAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Renseignez votre adresse e-mail et votre mot de passe." };
  const res = await loginAdmin(email, password);
  if (!res.ok) return { error: res.error };
  await setAdminCookie(res.sessionId);
  redirect(res.stage === "mfa" ? "/admin/connexion/verification" : "/admin");
}

export async function mfaAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const ctx = await getAdmin({ allowMfa: true });
  if (!ctx || ctx.stage !== "mfa") redirect("/admin/connexion");
  const ok = await completeMfa(ctx.sessionId, String(formData.get("code") ?? ""));
  if (!ok) return { error: "Code invalide ou expiré." };
  redirect("/admin");
}

export async function logoutAction() {
  await clearAdminCookie();
  redirect("/admin/connexion");
}

export async function forgotAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (email) {
    const admin = await admins.findOne((a) => a.email === email);
    const { ip } = await requestMeta();
    void ip;
    if (admin) await resetRequests.insert({ email, adminId: admin.id, status: "open" });
  }
  return { ok: "Si un compte correspond à cette adresse, la super administratrice est prévenue et vous transmettra un lien de réinitialisation." };
}

export async function resetAction(token: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  const issue = adminPasswordIssue(password);
  if (issue) return { error: issue };
  if (password !== confirm) return { error: "Les mots de passe ne correspondent pas." };
  const ok = await consumeResetToken(token, password);
  if (!ok) return { error: "Lien invalide ou expiré. Demandez un nouveau lien." };
  redirect("/admin/connexion?reinit=1");
}
