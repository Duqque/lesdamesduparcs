import "server-only";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

export function generateSecret() {
  const bytes = randomBytes(20);
  let bits = "";
  for (const b of bytes) bits += b.toString(2).padStart(8, "0");
  let out = "";
  for (let i = 0; i + 5 <= bits.length; i += 5) out += ALPHABET[parseInt(bits.slice(i, i + 5), 2)];
  return out;
}

function decode(secret: string) {
  let bits = "";
  for (const c of secret.replace(/=+$/, "").toUpperCase()) {
    const v = ALPHABET.indexOf(c);
    if (v >= 0) bits += v.toString(2).padStart(5, "0");
  }
  const bytes: number[] = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) bytes.push(parseInt(bits.slice(i, i + 8), 2));
  return Buffer.from(bytes);
}

function hotp(secret: string, counter: number) {
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64BE(BigInt(counter));
  const h = createHmac("sha1", decode(secret)).update(buf).digest();
  const o = h[h.length - 1] & 0xf;
  const code = ((h[o] & 0x7f) << 24) | (h[o + 1] << 16) | (h[o + 2] << 8) | h[o + 3];
  return String(code % 1_000_000).padStart(6, "0");
}

/** Vérifie un code TOTP à 6 chiffres (fenêtre de ±30 s) et renvoie le pas de temps correspondant (null si invalide). */
export function verifyTotpStep(secret: string, token: string): number | null {
  const clean = token.replace(/\s/g, "");
  if (!/^\d{6}$/.test(clean)) return null;
  const step = Math.floor(Date.now() / 30_000);
  for (const d of [-1, 0, 1]) {
    const a = Buffer.from(hotp(secret, step + d));
    const b = Buffer.from(clean);
    if (a.length === b.length && timingSafeEqual(a, b)) return step + d;
  }
  return null;
}

export const verifyTotp = (secret: string, token: string) => verifyTotpStep(secret, token) !== null;

export const otpauthUrl = (secret: string, account: string, issuer = "Les Dames du Parc") =>
  `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(account)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;
