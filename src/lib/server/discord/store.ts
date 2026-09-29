import "server-only";
import { collection, locked, type Row } from "../db";
import { getMemberById, updateMember, type DiscordLink } from "../store";

/**
 * Table d'unicité « discord_user_id → adhérente » : l'identifiant du document EST le discord_user_id, ce qui rend
 * structurellement impossible d'avoir deux lignes pour le même compte Discord (voir src/lib/server/db.ts, même
 * principe que l'unicité de l'e-mail dans src/lib/server/store.ts::addMember).
 */
interface DiscordLinkRow extends Row {
  memberId: string;
}
const discordLinks = collection<DiscordLinkRow>("discord_links");

export type LinkDiscordResult = { ok: true } | { ok: false; reason: "taken" };

/** Associe un compte Discord à une adhérente, de façon atomique : refuse si ce compte Discord appartient déjà à une autre. */
export async function linkDiscordAccount(memberId: string, discordUserId: string, username: string): Promise<LinkDiscordResult> {
  return locked<LinkDiscordResult>(async () => {
    const existing = await discordLinks.get(discordUserId);
    if (existing && existing.memberId !== memberId) return { ok: false, reason: "taken" };
    if (!existing) await discordLinks.insert({ id: discordUserId, memberId });
    const now = new Date().toISOString();
    const member = await getMemberById(memberId);
    await updateMember(memberId, {
      discord: { userId: discordUserId, username, connectedAt: member?.discord?.connectedAt ?? now, lastVerifiedAt: now, status: "ACTIVE" },
    });
    return { ok: true };
  });
}

/** Supprime l'association (déconnexion volontaire, changement de compte, action d'administration). */
export async function unlinkDiscordAccount(memberId: string) {
  const member = await getMemberById(memberId);
  const discordUserId = member?.discord?.userId;
  await locked(async () => {
    if (discordUserId) await discordLinks.remove(discordUserId);
    await updateMember(memberId, { discord: undefined });
  });
  return discordUserId ?? null;
}

/** Met à jour le statut d'une association déjà existante (synchronisation), sans toucher à l'unicité. */
export async function setDiscordLinkStatus(memberId: string, patch: Partial<DiscordLink>) {
  const member = await getMemberById(memberId);
  if (!member?.discord) return;
  await updateMember(memberId, { discord: { ...member.discord, ...patch, lastVerifiedAt: new Date().toISOString() } });
}
