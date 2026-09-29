import { redirectTo, siteUrl, throttled, tooMany } from "@/lib/server/http";
import { getSession } from "@/lib/server/session";
import { getMemberByNumber } from "@/lib/server/store";
import { membershipState } from "@/lib/server/business";
import { discordConfigured, discordRedirectUri } from "@/lib/server/discord/config";
import { consumeDiscordState } from "@/lib/server/discord/oauth";
import { addGuildRole, exchangeCodeForToken, fetchDiscordUser, joinGuild } from "@/lib/server/discord/client";
import { linkDiscordAccount, setDiscordLinkStatus } from "@/lib/server/discord/store";

/**
 * Retour de Discord après connexion. Le rôle n'est attribué que si toutes ces conditions tiennent, vérifiées ici,
 * côté serveur : session adhérente valide, jeton d'état correspondant (jamais réutilisé), adhésion toujours active,
 * et identifiant Discord non déjà associé à une autre adhérente (§5, §6, §10 du cahier des charges).
 */
export async function GET(req: Request) {
  if (await throttled(req, "discord-callback", 20, 600_000)) return tooMany();
  const url = new URL(req.url);
  const s = await getSession();
  if (s?.role !== "member") return redirectTo("/connexion");
  const stored = await getMemberByNumber(s.memberNumber);
  if (!stored) return redirectTo("/connexion");
  if (!discordConfigured()) return redirectTo("/profil?discord=indisponible");

  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  if (url.searchParams.get("error") || !code || !state) return redirectTo("/profil?discord=erreur");
  if (!(await consumeDiscordState(stored.id, state))) return redirectTo("/profil?discord=erreur");
  if ((await membershipState(stored.id)) !== "active") return redirectTo("/profil?discord=inactif");

  try {
    const accessToken = await exchangeCodeForToken(code, discordRedirectUri(siteUrl(req)));
    const discordUser = await fetchDiscordUser(accessToken);
    const link = await linkDiscordAccount(stored.id, discordUser.id, discordUser.username);
    if (!link.ok) return redirectTo("/profil?discord=deja-associe");
    try {
      await joinGuild(accessToken, discordUser.id);
      await addGuildRole(discordUser.id);
    } catch (e) {
      // Le compte est associé mais le rôle n'a pas pu être posé (permissions du bot, hiérarchie des rôles…) :
      // la prochaine synchronisation planifiée (POST /api/cron/tick) le réessaiera automatiquement.
      await setDiscordLinkStatus(stored.id, { status: "ERROR", lastError: e instanceof Error ? e.message : "Erreur Discord." });
      return redirectTo("/profil?discord=role-en-attente");
    }
    return redirectTo("/profil?discord=connecte");
  } catch {
    return redirectTo("/profil?discord=erreur");
  }
}
