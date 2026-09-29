"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { audit, requireAdmin } from "@/lib/server/admin-auth";
import { getMemberById } from "@/lib/server/store";
import { removeGuildRole } from "@/lib/server/discord/client";
import { unlinkDiscordAccount } from "@/lib/server/discord/store";
import { syncAllDiscordRoles, syncDiscordRoleFor } from "@/lib/server/discord/sync";

const PATH = "/admin/communaute/discord";
const back = (msg: { ok?: string; erreur?: string }) => redirect(`${PATH}?${msg.ok ? `ok=${encodeURIComponent(msg.ok)}` : `erreur=${encodeURIComponent(msg.erreur!)}`}`);

/** Déconnexion forcée par l'administration (compte litigieux, demande de l'adhérente) : retire le rôle puis l'association. */
export async function disconnectDiscordAction(memberId: string) {
  const ctx = await requireAdmin("discord.manage");
  const member = await getMemberById(memberId);
  const discordUserId = await unlinkDiscordAccount(memberId);
  if (discordUserId) await removeGuildRole(discordUserId).catch(() => undefined);
  await audit(ctx, "discord.disconnect", "member", `Compte Discord déconnecté : ${member?.firstName} ${member?.lastName}`, { entityId: memberId });
  revalidatePath(PATH);
  back({ ok: "Compte Discord déconnecté." });
}

/** Force une nouvelle vérification (rôle ajouté ou retiré selon l'adhésion actuelle) pour une adhérente. */
export async function forceSyncDiscordAction(memberId: string) {
  const ctx = await requireAdmin("discord.manage");
  const member = await getMemberById(memberId);
  if (member?.discord) await syncDiscordRoleFor(memberId, member.discord.userId, member.discord.status);
  await audit(ctx, "discord.sync", "member", `Synchronisation Discord forcée : ${member?.firstName} ${member?.lastName}`, { entityId: memberId });
  revalidatePath(PATH);
  back({ ok: "Synchronisation effectuée." });
}

/** Resynchronise toutes les adhérentes ayant un compte Discord lié. */
export async function forceSyncAllDiscordAction() {
  const ctx = await requireAdmin("discord.manage");
  const n = await syncAllDiscordRoles();
  await audit(ctx, "discord.sync-all", "member", `Synchronisation Discord globale (${n} compte${n > 1 ? "s" : ""})`);
  revalidatePath(PATH);
  back({ ok: `${n} compte${n > 1 ? "s" : ""} vérifié${n > 1 ? "s" : ""}.` });
}
