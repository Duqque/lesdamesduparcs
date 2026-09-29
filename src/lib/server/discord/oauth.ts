import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { getMemberById, updateMember } from "../store";
import { discordConfig, discordRedirectUri } from "./config";

/**
 * Jeton d'état OAuth : aléatoire, à usage unique, courte durée de vie (10 min). Seule son empreinte est conservée sur
 * la fiche de l'adhérente qui a démarré la connexion (même principe que member-reset.ts). Protège contre le CSRF et
 * garantit que le retour de Discord correspond bien à l'adhérente qui a cliqué « Connecter mon compte Discord ».
 */
export async function createDiscordState(memberId: string, ttlMs = 10 * 60_000) {
  const token = randomBytes(24).toString("base64url");
  await updateMember(memberId, { discordState: { hash: createHash("sha256").update(token).digest("hex"), exp: Date.now() + ttlMs } });
  return token;
}

/** Consomme le jeton d'état : renvoie l'adhérente correspondante et invalide le jeton (usage unique), quel que soit le résultat. */
export async function consumeDiscordState(memberId: string, token: string) {
  const member = await getMemberById(memberId);
  const hash = createHash("sha256").update(token).digest("hex");
  const valid = Boolean(member?.discordState && member.discordState.hash === hash && member.discordState.exp > Date.now());
  await updateMember(memberId, { discordState: undefined });
  return valid;
}

export function discordAuthorizeUrl(state: string, origin: string) {
  const c = discordConfig();
  const url = new URL("https://discord.com/oauth2/authorize");
  url.searchParams.set("client_id", c.clientId);
  url.searchParams.set("redirect_uri", discordRedirectUri(origin));
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "identify guilds.join");
  url.searchParams.set("state", state);
  url.searchParams.set("prompt", "consent");
  return url.toString();
}
