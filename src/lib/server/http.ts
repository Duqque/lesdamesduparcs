import "server-only";
import { sqlEnabled, sqlHit, sqlPurgeRate } from "./sql";

export const json = (data: unknown, status = 200) =>
  Response.json(data, { status, headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } });

/**
 * Adresse du client. Derrière un ou plusieurs relais de confiance, l'adresse fiable est celle ajoutée par le relais le
 * plus proche de nous : on lit X-Forwarded-For depuis la DROITE (TRUSTED_PROXY_HOPS relais, 1 par défaut) — la partie
 * gauche est contrôlée par le client et ne doit jamais servir à limiter les tentatives.
 */
export function clientIp(h: Headers) {
  const hops = Math.max(Number(process.env.TRUSTED_PROXY_HOPS ?? 1) || 1, 1);
  const chain = (h.get("x-forwarded-for") ?? "").split(",").map((x) => x.trim()).filter(Boolean);
  return (chain.length ? chain[Math.max(chain.length - hops, 0)] : "") || h.get("x-real-ip") || "local";
}

const hits = new Map<string, { n: number; reset: number }>();
let lastPurge = 0;

/**
 * Limiteur de tentatives : compteur partagé en base (plusieurs processus), en mémoire sinon.
 * `key` distingue l'usage (ex. "login:ip", "login:compte"). Renvoie true quand la limite est dépassée.
 */
export async function throttled(req: Request, scope: string, max = 10, windowMs = 600_000, extra = "") {
  const key = `${scope}:${extra || clientIp(req.headers)}`.slice(0, 190);
  if (sqlEnabled()) {
    try {
      const now = Date.now();
      if (now - lastPurge > 3_600_000) {
        lastPurge = now;
        void sqlPurgeRate().catch(() => undefined);
      }
      return (await sqlHit(key, windowMs)) > max;
    } catch {
      /* base indisponible : on retombe sur le compteur mémoire plutôt que de laisser passer sans limite */
    }
  }
  const now = Date.now();
  const entry = hits.get(key);
  if (!entry || entry.reset < now) {
    hits.set(key, { n: 1, reset: now + windowMs });
    if (hits.size > 5000) for (const [k, v] of hits) if (v.reset < now) hits.delete(k);
    return false;
  }
  entry.n += 1;
  return entry.n > max;
}

export const tooMany = () => json({ error: "Trop de tentatives. Réessayez dans quelques minutes." }, 429);

/** Adresse publique du site depuis une server action (pas de Request) : variable d'environnement, sinon en-têtes de la requête. */
export async function siteOrigin() {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  const { headers } = await import("next/headers");
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost";
  return `${h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https")}://${host}`;
}

export const siteUrl = (req: Request) => process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || new URL(req.url).origin;

/** Corps JSON limité en taille (64 Ko par défaut) : refuse plutôt que de charger un corps démesuré en mémoire. */
export async function readJson<T = unknown>(req: Request, maxBytes = 64 * 1024): Promise<T | null> {
  if (Number(req.headers.get("content-length") ?? 0) > maxBytes) return null;
  try {
    const text = await req.text();
    if (text.length > maxBytes) return null;
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}
