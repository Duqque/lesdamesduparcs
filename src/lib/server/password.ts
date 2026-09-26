import "server-only";
import { randomBytes, scrypt, timingSafeEqual, type ScryptOptions } from "node:crypto";

/**
 * Mots de passe : scrypt (mémoire-dure, recommandé par l'OWASP quand Argon2id n'est pas disponible), sel unique,
 * paramètres conservés dans le hachage pour pouvoir les durcir plus tard.
 * Format : scrypt$N$r$p$sel$hachage   (ancien format sans paramètres : scrypt$sel$hachage → N=16384, r=8, p=1)
 * Calcul asynchrone : ne bloque pas le serveur pendant la vérification.
 */
const N = 2 ** 15;
const R = 8;
const P = 3;
const KEYLEN = 64;

const derive = (password: string, salt: Buffer, len: number, n: number, r: number, p: number, normalize = true) =>
  new Promise<Buffer>((resolve, reject) => {
    const opts: ScryptOptions = { N: n, r, p, maxmem: 256 * n * r + 1024 * 1024 };
    scrypt(normalize ? password.normalize("NFKC") : password, salt, len, opts, (err, key) => (err ? reject(err) : resolve(key)));
  });

export async function hashPassword(password: string) {
  const salt = randomBytes(16);
  const key = await derive(password, salt, KEYLEN, N, R, P);
  return `scrypt$${N}$${R}$${P}$${salt.toString("base64url")}$${key.toString("base64url")}`;
}

function parse(stored: string) {
  const parts = stored.split("$");
  if (parts[0] !== "scrypt") return null;
  if (parts.length === 3) return { n: 16384, r: 8, p: 1, salt: parts[1], hash: parts[2], legacy: true };
  if (parts.length === 6) return { n: Number(parts[1]), r: Number(parts[2]), p: Number(parts[3]), salt: parts[4], hash: parts[5], legacy: false };
  return null;
}

export async function verifyPassword(password: string, stored: string) {
  const s = stored ? parse(stored) : null;
  if (!s || !s.salt || !s.hash || !s.n || s.n > 2 ** 20) return false;
  const expected = Buffer.from(s.hash, "base64url");
  // Les anciens hachages (sans paramètres) ont été calculés sans normalisation Unicode.
  const actual = await derive(password, Buffer.from(s.salt, "base64url"), expected.length, s.n, s.r, s.p, !s.legacy);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

/** Vrai quand le hachage stocké utilise des paramètres plus faibles que les paramètres actuels (à re-hacher à la connexion). */
export function needsRehash(stored: string) {
  const s = stored ? parse(stored) : null;
  return !s || s.n < N || s.p < P || s.r < R;
}

let dummy: Promise<string> | null = null;
/** Hachage factice : la vérification est exécutée même si le compte n'existe pas (temps de réponse identique). */
export const dummyHash = () => (dummy ??= hashPassword("mot-de-passe-factice-inutilisable"));
