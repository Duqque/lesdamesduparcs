import "server-only";
import { dropAccessToken, getAccessToken } from "./auth";
import { helloAssoConfig } from "./config";

export class HelloAssoError extends Error {
  constructor(message: string, readonly status: number, readonly code?: string) {
    super(message);
  }
}

/** Appel de l'API HelloAsso v5 avec le jeton de l'environnement courant ; un jeton expiré (401) est renouvelé une fois. */
export async function haFetch<T>(pathname: string, init?: { method?: string; body?: unknown; headers?: Record<string, string> }, retried = false): Promise<T> {
  const c = helloAssoConfig();
  const res = await fetch(`${c.apiUrl}${pathname}`, {
    method: init?.method ?? "GET",
    headers: { Authorization: `Bearer ${await getAccessToken()}`, ...(init?.body ? { "Content-Type": "application/json" } : {}), ...init?.headers },
    body: init?.body ? JSON.stringify(init.body) : undefined,
    cache: "no-store",
    signal: AbortSignal.timeout(20_000),
  });
  const text = await res.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    /* réponse non JSON */
  }
  if (!res.ok) {
    if (res.status === 401 && !retried) {
      dropAccessToken();
      return haFetch<T>(pathname, init, true);
    }
    const d = data as { message?: string; errors?: Array<{ code?: string; message?: string }> } | null;
    throw new HelloAssoError(d?.errors?.[0]?.message ?? d?.message ?? `Erreur HelloAsso (${res.status}).`, res.status, d?.errors?.[0]?.code);
  }
  return data as T;
}
