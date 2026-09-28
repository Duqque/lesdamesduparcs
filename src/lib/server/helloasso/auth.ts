import "server-only";
import { helloAssoConfig, type HelloAssoEnv } from "./config";

/** Jeton d'accès OAuth2 « client credentials » (valable 30 min), mis en cache PAR environnement et renouvelé avant expiration. */
const g = globalThis as unknown as { __haTokens?: Partial<Record<HelloAssoEnv, { value: string; exp: number }>> };

export function dropAccessToken() {
  const c = helloAssoConfig();
  if (g.__haTokens) delete g.__haTokens[c.env];
}

export async function getAccessToken(): Promise<string> {
  const c = helloAssoConfig();
  const cached = g.__haTokens?.[c.env];
  if (cached && cached.exp > Date.now() + 60_000) return cached.value;
  const res = await fetch(c.authUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "client_credentials", client_id: c.clientId, client_secret: c.clientSecret }),
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw new Error("Authentification HelloAsso refusée.");
  const data = (await res.json()) as { access_token?: string; expires_in?: number };
  if (!data.access_token) throw new Error("Authentification HelloAsso refusée.");
  (g.__haTokens ??= {})[c.env] = { value: data.access_token, exp: Date.now() + (data.expires_in ?? 1800) * 1000 };
  return data.access_token;
}
