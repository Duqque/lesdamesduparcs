import { json, throttled, tooMany } from "@/lib/server/http";
import { getSession } from "@/lib/server/session";
import { getMemberByNumber } from "@/lib/server/store";
import { removeGuildRole } from "@/lib/server/discord/client";
import { unlinkDiscordAccount } from "@/lib/server/discord/store";

/** Déconnexion volontaire (bouton « Modifier mon compte Discord » de /profil, avec confirmation) : retire le rôle puis l'association. */
export async function POST(req: Request) {
  if (await throttled(req, "discord-disconnect", 20, 600_000)) return tooMany();
  const s = await getSession();
  if (s?.role !== "member") return json({ error: "Non connectée." }, 401);
  const stored = await getMemberByNumber(s.memberNumber);
  if (!stored) return json({ error: "Compte introuvable." }, 404);
  const discordUserId = await unlinkDiscordAccount(stored.id);
  if (discordUserId) await removeGuildRole(discordUserId).catch(() => undefined);
  return json({ ok: true });
}
