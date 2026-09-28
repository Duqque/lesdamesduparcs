"use server";

import { safeUrl } from "@/lib/safe-url";
import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ROLE_LABELS, type Role } from "@/lib/admin/permissions";
import { audit, createResetToken, logoutAllSessions, requireAdmin, requireFresh } from "@/lib/server/admin-auth";
import { admins, resetRequests, settings } from "@/lib/server/admin-store";
import { hashPassword } from "@/lib/server/password";

const s = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
const ROLES = Object.keys(ROLE_LABELS) as Role[];
/** Message sensible (mot de passe provisoire, lien de réinitialisation) : cookie de 45 secondes, jamais dans l'adresse. */
async function secretFlash(msg: string) {
  (await cookies()).set("ddp_admin_flash", msg, { httpOnly: true, sameSite: "strict", path: "/admin/configuration/administratrices", maxAge: 45, secure: process.env.NODE_ENV === "production" && process.env.SESSION_INSECURE_COOKIE !== "1" });
}

function back(kind: "ok" | "erreur", msg: string, path = "/admin/configuration/administratrices"): never {
  redirect(`${path}?${kind}=${encodeURIComponent(msg)}`);
}

export async function createAdminAction(formData: FormData) {
  const ctx = await requireAdmin("admins.manage");
  await requireFresh(ctx);
  const email = s(formData, "email").toLowerCase();
  const role = s(formData, "role") as Role;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || !ROLES.includes(role) || !s(formData, "firstName")) back("erreur", "Prénom, e-mail et rôle valides requis.");
  if (await admins.findOne((a) => a.email === email)) back("erreur", "Un compte existe déjà avec cette adresse.");
  const temp = randomBytes(9).toString("base64url") + "9a";
  const row = await admins.insert({ email, firstName: s(formData, "firstName"), lastName: s(formData, "lastName"), role, passwordHash: await hashPassword(temp), active: true, totpEnabled: false, knownIps: [], mustChangePassword: true });
  await audit(ctx, "création", "administratrice", `Compte créé : ${email} (${ROLE_LABELS[role]})`, { entityId: row.id });
  await secretFlash(`Compte créé pour ${email}. Mot de passe provisoire (à transmettre, il ne sera plus affiché) : ${temp}`);
  back("ok", "Compte créé.");
}

export async function updateAdminAction(id: string, formData: FormData) {
  const ctx = await requireAdmin("admins.manage");
  await requireFresh(ctx);
  const target = await admins.get(id);
  if (!target) back("erreur", "Compte introuvable.");
  const role = s(formData, "role") as Role;
  const active = formData.get("active") === "on";
  if (!ROLES.includes(role)) back("erreur", "Rôle invalide.");
  const supers = (await admins.all()).filter((a) => a.role === "super" && a.active);
  if (target.role === "super" && (role !== "super" || !active) && supers.length <= 1) back("erreur", "Il doit rester au moins une super administratrice active.");
  if (target.id === ctx.admin.id && !active) back("erreur", "Vous ne pouvez pas désactiver votre propre compte.");
  await admins.update(id, { role, active, firstName: s(formData, "firstName") || target.firstName, lastName: s(formData, "lastName") });
  if (!active || role !== target.role) await logoutAllSessions(id);
  await audit(ctx, "modification", "administratrice", `${target.email} : rôle ${ROLE_LABELS[role]}, ${active ? "actif" : "désactivé"}`, { entityId: id, before: { role: target.role, active: target.active }, after: { role, active } });
  revalidatePath("/admin/configuration/administratrices");
  back("ok", "Compte mis à jour.");
}

export async function resetLinkAction(id: string) {
  const ctx = await requireAdmin("admins.manage");
  await requireFresh(ctx);
  const target = await admins.get(id);
  if (!target) back("erreur", "Compte introuvable.");
  const token = await createResetToken(id);
  for (const r of await resetRequests.find((x) => x.adminId === id && x.status === "open")) await resetRequests.update(r.id, { status: "done" });
  await audit(ctx, "réinitialisation", "administratrice", `Lien de réinitialisation généré pour ${target.email}`, { entityId: id });
  await secretFlash(`Lien de réinitialisation pour ${target.email} (valable 2 h, à transmettre) : /admin/reinitialiser/${token}`);
  back("ok", "Lien généré.");
}

export async function revokeSessionsAction(id: string) {
  const ctx = await requireAdmin("admins.manage");
  await requireFresh(ctx);
  await logoutAllSessions(id);
  await audit(ctx, "sécurité", "administratrice", "Toutes les sessions ont été fermées", { entityId: id });
  back("ok", "Toutes les sessions de ce compte sont fermées.");
}

export async function saveSecurityAction(formData: FormData) {
  const ctx = await requireAdmin("admins.manage");
  await requireFresh(ctx);
  const before = (await settings.get()).security;
  const security = {
    sessionTimeoutMin: Math.min(Math.max(Number(s(formData, "timeout")) || 30, 5), 480),
    maxAttempts: Math.min(Math.max(Number(s(formData, "attempts")) || 5, 3), 20),
    lockoutMin: Math.min(Math.max(Number(s(formData, "lockout")) || 15, 1), 240),
    require2fa: formData.get("require2fa") === "on",
  };
  await settings.set({ security });
  await audit(ctx, "modification", "sécurité", "Paramètres de sécurité modifiés", { before, after: security });
  back("ok", "Sécurité enregistrée.", "/admin/configuration/roles");
}

export async function saveSettingsAction(section: "adhesions" | "payments" | "emails" | "association", formData: FormData) {
  const ctx = await requireAdmin("settings.edit");
  const cur = await settings.get();
  const path = `/admin/configuration/${section === "payments" ? "paiements" : section === "emails" ? "emails" : section === "adhesions" ? "adhesions" : "association"}`;
  if (section === "adhesions") {
    await settings.set({ adhesions: { seasonStartMonth: Math.min(Math.max(Number(s(formData, "startMonth")) || 9, 1), 12), renewalReminderDays: s(formData, "reminders").split(",").map((x) => Number(x.trim())).filter((n) => n > 0), autoRenew: formData.get("autoRenew") === "on", openToAll: formData.get("openToAll") === "on" } });
  } else if (section === "payments") {
    await settings.set({ payments: { currency: s(formData, "currency") || "EUR", refundPolicy: s(formData, "refundPolicy"), onlinePayment: formData.get("onlinePayment") === "on" } });
  } else if (section === "emails") {
    await settings.set({ emails: { fromName: s(formData, "fromName"), fromEmail: s(formData, "fromEmail"), signature: s(formData, "signature") } });
  } else {
    const a = cur.association;
    const keys = ["name", "legalName", "form", "siret", "rna", "address", "postalCode", "city", "phone", "email", "website", "president", "presidentTitle", "instagram", "tiktok", "facebook"] as const;
    await settings.set({ association: Object.fromEntries(keys.map((k) => [k, (["website", "instagram", "tiktok", "facebook"].includes(k) ? safeUrl(s(formData, k)) : s(formData, k)) || (k === "name" || k === "legalName" ? a[k] : "")])) as unknown as typeof a });
  }
  await audit(ctx, "modification", "paramètres", `Paramètres « ${section} » modifiés`);
  revalidatePath("/", "layout");
  back("ok", "Paramètres enregistrés.", path);
}

/** Modèle de facture : numérotation, mention légale, signataire, tampon de l'association (photo) et signature. */
export async function saveInvoiceSettingsAction(formData: FormData) {
  const ctx = await requireAdmin("settings.edit");
  const path = "/admin/configuration/factures";
  const cur = (await settings.get()).invoice;
  const next = { ...cur, prefix: (s(formData, "prefix") || "FAC").replace(/[^A-Za-z0-9]/g, "").slice(0, 8).toUpperCase() || "FAC", legalNote: s(formData, "legalNote").slice(0, 200), signerName: s(formData, "signerName").slice(0, 80), signerTitle: s(formData, "signerTitle").slice(0, 80) };
  const { saveMedia, mediaUrl, deleteMedia } = await import("@/lib/server/media");
  for (const field of ["stamp", "signature"] as const) {
    if (formData.get(`${field}Remove`) === "on") next[field] = "";
    const file = formData.get(`${field}File`);
    if (file instanceof File && file.size > 0) {
      const up = await saveMedia(file);
      if (!up.ok) back("erreur", up.error, path);
      if (up.media.mime !== "image/png" && up.media.mime !== "image/jpeg") {
        await deleteMedia(up.media.id);
        back("erreur", "Le tampon et la signature doivent être une image PNG ou JPEG (un PNG à fond transparent donne le meilleur rendu).", path);
      }
      next[field] = mediaUrl(up.media);
    }
  }
  await settings.set({ invoice: next });
  await audit(ctx, "modification", "paramètres", "Modèle de facture modifié (numérotation, signataire, tampon, signature)");
  back("ok", "Modèle de facture enregistré : il s'applique aux prochaines factures.", path);
}
