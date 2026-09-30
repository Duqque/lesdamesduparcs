"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { audit, requireAdmin } from "@/lib/server/admin-auth";
import { settings } from "@/lib/server/admin-store";
import { sendAdhesionCampaignEmail } from "@/lib/server/comms";

const s = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
const back = (msg: { ok?: string; erreur?: string }) => redirect(`/admin/adherentes/campagne?${msg.ok ? `ok=${encodeURIComponent(msg.ok)}` : `erreur=${encodeURIComponent(msg.erreur!)}`}`);

/** Pause ou nombre maximum d'adhésions (Adhérentes > Campagne d'adhésions) : ouvertes par défaut, jusqu'à `limit`. */
export async function saveAdhesionCampaignAction(formData: FormData) {
  const ctx = await requireAdmin("settings.edit");
  const cur = await settings.get();
  const paused = formData.get("paused") === "on";
  const limit = Math.max(1, Number(s(formData, "limit")) || cur.adhesions.limit);
  await settings.set({ adhesions: { ...cur.adhesions, paused, limit } });
  await audit(ctx, "modification", "campagne", paused ? "Adhésions mises en pause" : `Adhésions ouvertes, plafond : ${limit}`);
  revalidatePath("/", "layout");
  back({ ok: "Enregistré." });
}

/** Mail de relance envoyé une fois, à la demande, aux comptes déjà créés mais sans adhésion active. */
export async function sendReengagementEmailAction() {
  const ctx = await requireAdmin("settings.edit");
  const { adhesions } = await settings.get();
  const { sent, total } = await sendAdhesionCampaignEmail({ label: "adhésions", limit: adhesions.limit });
  await audit(ctx, "modification", "campagne", `Mail de relance envoyé à ${sent}/${total} compte${total > 1 ? "s" : ""}`);
  back({ ok: total ? `Mail de relance envoyé à ${sent}/${total} compte${total > 1 ? "s" : ""}.` : "Aucun compte sans adhésion active à relancer." });
}
