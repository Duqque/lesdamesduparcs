import "server-only";
import { membershipState } from "../business";
import { listStoredMembers } from "../store";
import { discordConfigured } from "./config";
import { addGuildRole, removeGuildRole } from "./client";
import { setDiscordLinkStatus } from "./store";

/**
 * Réconcilie le rôle Discord d'une adhérente avec son adhésion (source de vérité : membershipState()). Appelée par le
 * cron (toutes les adhérentes liées) et par le bouton admin « forcer une synchronisation » (une seule adhérente).
 */
export async function syncDiscordRoleFor(memberId: string, discordUserId: string, currentStatus: "ACTIVE" | "INACTIVE" | "ERROR") {
  if (!discordConfigured()) return;
  const active = (await membershipState(memberId)) === "active";
  try {
    if (active && currentStatus !== "ACTIVE") {
      await addGuildRole(discordUserId);
      await setDiscordLinkStatus(memberId, { status: "ACTIVE", lastError: undefined });
    } else if (!active && currentStatus !== "INACTIVE") {
      await removeGuildRole(discordUserId);
      await setDiscordLinkStatus(memberId, { status: "INACTIVE", lastError: undefined });
    } else {
      await setDiscordLinkStatus(memberId, {});
    }
  } catch (e) {
    await setDiscordLinkStatus(memberId, { status: "ERROR", lastError: e instanceof Error ? e.message : "Erreur Discord." });
  }
}

/** Repasse en revue toutes les adhérentes ayant un compte Discord lié. Renvoie le nombre de comptes vérifiés. */
export async function syncAllDiscordRoles() {
  if (!discordConfigured()) return 0;
  const members = (await listStoredMembers()).filter((m) => m.discord);
  for (const m of members) await syncDiscordRoleFor(m.id, m.discord!.userId, m.discord!.status);
  return members.length;
}
