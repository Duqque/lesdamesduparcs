import "server-only";
import { randomBytes } from "node:crypto";
import { listStore, locked } from "./db";

/**
 * Clé de signature des sessions. `AUTH_SECRET` (24 caractères min.) est prioritaire ; à défaut, une clé aléatoire est
 * générée une seule fois et conservée dans la base de données (collection __secrets), partagée par tous les processus.
 * `ensureAuthSecret()` doit être attendu avant tout usage de `authSecret()`.
 */
const store = listStore<{ id: string; value: string }>("__secrets");
const g = globalThis as unknown as { __ddpSecret?: Promise<string> };

export function ensureAuthSecret(): Promise<string> {
  const env = process.env.AUTH_SECRET;
  if (env && env.length >= 24) return Promise.resolve(env);
  g.__ddpSecret ??= locked(async () => {
    const found = await store.get("auth");
    if (found && found.value.length >= 24) return found.value;
    const value = randomBytes(48).toString("base64url");
    await store.upsert({ id: "auth", value });
    return value;
  });
  g.__ddpSecret.catch(() => {
    g.__ddpSecret = undefined;
  });
  return g.__ddpSecret;
}

let resolved = "";
/** Clé déjà chargée (après `await ensureAuthSecret()`). */
export function authSecret() {
  const env = process.env.AUTH_SECRET;
  if (env && env.length >= 24) return env;
  return resolved;
}
export async function loadAuthSecret() {
  resolved = await ensureAuthSecret();
  return resolved;
}
