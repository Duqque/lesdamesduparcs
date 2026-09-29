import "server-only";
import { discordConfig } from "./config";

export class DiscordError extends Error {
  constructor(message: string, readonly status: number, readonly code?: number) {
    super(message);
  }
}

/** Appel générique à l'API Discord (jeton du bot ou jeton d'accès OAuth selon `token`). */
async function discordFetch<T>(pathname: string, token: string, init?: { method?: string; body?: unknown }): Promise<T | null> {
  const c = discordConfig();
  const res = await fetch(`${c.apiUrl}${pathname}`, {
    method: init?.method ?? "GET",
    headers: { Authorization: token, ...(init?.body ? { "Content-Type": "application/json" } : {}) },
    body: init?.body ? JSON.stringify(init.body) : undefined,
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });
  if (res.status === 204) return null;
  const text = await res.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    /* réponse non JSON */
  }
  if (!res.ok) {
    const d = data as { message?: string; code?: number } | null;
    throw new DiscordError(d?.message ?? `Erreur Discord (${res.status}).`, res.status, d?.code);
  }
  return data as T;
}

const bot = (token: string) => `Bot ${token}`;

/** Échange le code d'autorisation contre un jeton d'accès (grant_type=authorization_code). */
export async function exchangeCodeForToken(code: string, redirectUri: string) {
  const c = discordConfig();
  const body = new URLSearchParams({
    client_id: c.clientId,
    client_secret: c.clientSecret,
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
  });
  const res = await fetch("https://discord.com/api/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });
  const data = (await res.json().catch(() => null)) as { access_token?: string; error?: string; error_description?: string } | null;
  if (!res.ok || !data?.access_token) throw new DiscordError(data?.error_description ?? data?.error ?? "Échange du code Discord refusé.", res.status);
  return data.access_token;
}

/** Identité Discord associée au jeton d'accès (scope `identify`). */
export async function fetchDiscordUser(accessToken: string) {
  const user = await discordFetch<{ id: string; username: string; global_name?: string }>("/users/@me", `Bearer ${accessToken}`);
  if (!user) throw new DiscordError("Identité Discord introuvable.", 500);
  return { id: user.id, username: user.global_name || user.username };
}

/**
 * Ajoute (ou confirme) l'appartenance de l'utilisateur au serveur et lui attribue directement le rôle « Adhérente »
 * (scope OAuth `guilds.join`, jeton du bot). Un second appel explicite (`addGuildRole`) suit toujours cet appel :
 * Discord n'applique pas toujours `roles` ici si la personne était déjà membre du serveur.
 */
export async function joinGuild(accessToken: string, discordUserId: string) {
  const c = discordConfig();
  // 201 (ajoutée) ou 204 (déjà membre) sont tous les deux des succès pour discordFetch ; seule une vraie erreur est levée.
  await discordFetch(`/guilds/${c.guildId}/members/${discordUserId}`, bot(c.botToken), {
    method: "PUT",
    body: { access_token: accessToken, roles: [c.roleId] },
  });
}

export async function addGuildRole(discordUserId: string) {
  const c = discordConfig();
  await discordFetch(`/guilds/${c.guildId}/members/${discordUserId}/roles/${c.roleId}`, bot(c.botToken), { method: "PUT" });
}

export async function removeGuildRole(discordUserId: string) {
  const c = discordConfig();
  await discordFetch(`/guilds/${c.guildId}/members/${discordUserId}/roles/${c.roleId}`, bot(c.botToken), { method: "DELETE" });
}
