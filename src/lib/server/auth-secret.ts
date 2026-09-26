import "server-only";
import { randomBytes } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

let cached = "";

/**
 * Clé de signature des sessions. `AUTH_SECRET` (24 caractères min.) est prioritaire ; à défaut, une clé aléatoire
 * est générée au premier lancement et conservée dans `.data/auth-secret` : aucune configuration requise.
 */
export function authSecret() {
  const env = process.env.AUTH_SECRET;
  if (env && env.length >= 24) return env;
  if (cached) return cached;
  const dir = path.join(process.cwd(), ".data");
  const file = path.join(dir, "auth-secret");
  try {
    if (existsSync(file)) cached = readFileSync(file, "utf8").trim();
    if (cached.length < 24) {
      cached = randomBytes(48).toString("base64url");
      mkdirSync(dir, { recursive: true });
      writeFileSync(file, cached, { mode: 0o600 });
    }
  } catch {
    // Disque en lecture seule : clé propre à ce processus (les sessions expirent au redémarrage).
    cached = cached || randomBytes(48).toString("base64url");
  }
  return cached;
}
