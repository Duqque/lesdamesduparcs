import { redirectTo, siteUrl, throttled, tooMany } from "@/lib/server/http";
import { getSession } from "@/lib/server/session";
import { getMemberByNumber } from "@/lib/server/store";
import { membershipState } from "@/lib/server/business";
import { discordConfigured } from "@/lib/server/discord/config";
import { createDiscordState, discordAuthorizeUrl } from "@/lib/server/discord/oauth";

/**
 * Démarre la connexion Discord : l'adhésion active est vérifiée ici, côté serveur — jamais côté navigateur — avant
 * toute redirection vers Discord. Un lien d'invitation ou une URL Discord ne suffisent jamais à obtenir le rôle :
 * seul ce parcours, qui part d'une session adhérente valide, y mène.
 */
export async function GET(req: Request) {
  if (await throttled(req, "discord-authorize", 20, 600_000)) return tooMany();
  const s = await getSession();
  if (s?.role !== "member") return redirectTo("/connexion");
  const stored = await getMemberByNumber(s.memberNumber);
  if (!stored) return redirectTo("/connexion");
  if (!discordConfigured()) return redirectTo("/profil?discord=indisponible");
  if ((await membershipState(stored.id)) !== "active") return redirectTo("/profil?discord=inactif");
  const token = await createDiscordState(stored.id);
  return new Response(null, { status: 307, headers: { Location: discordAuthorizeUrl(token, siteUrl(req)), "Cache-Control": "no-store" } });
}
