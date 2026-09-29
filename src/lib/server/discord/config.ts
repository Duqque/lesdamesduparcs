import "server-only";

/**
 * Configuration Discord (OAuth2 + bot) : identifiants de l'application Discord (Developer Portal), jeton du bot,
 * identifiant du serveur et du rôle « Adhérente ». Tant que ces variables ne sont pas renseignées, `configured` est
 * faux et les routes /api/discord/* répondent par une erreur claire plutôt que d'échouer silencieusement.
 */
const env = (k: string) => process.env[k]?.trim() ?? "";

export interface DiscordConfig {
  clientId: string;
  clientSecret: string;
  botToken: string;
  guildId: string;
  roleId: string;
  apiUrl: string;
  configured: boolean;
}

export function discordConfig(): DiscordConfig {
  const clientId = env("DISCORD_CLIENT_ID");
  const clientSecret = env("DISCORD_CLIENT_SECRET");
  const botToken = env("DISCORD_BOT_TOKEN");
  const guildId = env("DISCORD_GUILD_ID");
  const roleId = env("DISCORD_ROLE_ID");
  return {
    clientId,
    clientSecret,
    botToken,
    guildId,
    roleId,
    apiUrl: "https://discord.com/api/v10",
    configured: Boolean(clientId && clientSecret && botToken && guildId && roleId),
  };
}

export const discordConfigured = () => discordConfig().configured;

/** Adresse à laquelle Discord redirige après connexion : doit être enregistrée telle quelle dans le Developer Portal. */
export const discordRedirectUri = (origin: string) => `${origin.replace(/\/$/, "")}/api/discord/callback`;
