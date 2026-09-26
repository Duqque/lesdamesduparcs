"use server";

import { redirect } from "next/navigation";
import { confirmIdentity, requireAdmin, safeAdminPath } from "@/lib/server/admin-auth";

export async function confirmIdentityAction(formData: FormData) {
  const ctx = await requireAdmin();
  const next = safeAdminPath(String(formData.get("next") ?? ""));
  const ok = await confirmIdentity(ctx, String(formData.get("password") ?? "").slice(0, 200), String(formData.get("code") ?? "").slice(0, 20));
  if (!ok) redirect(`/admin/verification-identite?next=${encodeURIComponent(next)}&erreur=${encodeURIComponent("Mot de passe ou code incorrect.")}`);
  redirect(next);
}
