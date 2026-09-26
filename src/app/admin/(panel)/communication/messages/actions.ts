"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { audit, requireAdmin } from "@/lib/server/admin-auth";
import { contactMessages } from "@/lib/server/content";

function back(m: { ok?: string; erreur?: string }): never {
  redirect(`/admin/communication/messages?${m.ok ? `ok=${encodeURIComponent(m.ok)}` : `erreur=${encodeURIComponent(m.erreur!)}`}`);
}

export async function setContactStatusAction(id: string, status: "new" | "read" | "done") {
  const ctx = await requireAdmin("communication.send");
  const m = await contactMessages.get(id);
  if (!m) back({ erreur: "Message introuvable." });
  await contactMessages.update(id, { status, handledBy: status === "new" ? undefined : `${ctx.admin.firstName} ${ctx.admin.lastName}`.trim() });
  await audit(ctx, "modification", "message de contact", `Message ${id.slice(0, 8)} : ${status === "done" ? "traité" : status === "read" ? "lu" : "non lu"}`, { entityId: id });
  revalidatePath("/admin", "layout");
  back({ ok: "Message mis à jour." });
}

export async function deleteContactAction(id: string) {
  const ctx = await requireAdmin("communication.send");
  await contactMessages.remove(id);
  await audit(ctx, "suppression", "message de contact", `Message de contact supprimé (${id.slice(0, 8)})`, { entityId: id });
  revalidatePath("/admin", "layout");
  back({ ok: "Message supprimé." });
}
