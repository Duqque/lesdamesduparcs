import "server-only";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";

/**
 * Signature d'une notification : HMAC-SHA256 hexadécimal du corps brut (en-tête `x-ha-signature`). Selon la documentation HelloAsso,
 * la signature est réservée aux partenaires ; une association s'appuie sur l'adresse secrète + la relecture du paiement par l'API.
 */
export function verifySignature(rawBody: string, header: string | null, key: string) {
  if (!header || !key) return false;
  const expected = createHmac("sha256", key).update(rawBody).digest();
  const got = Buffer.from(header.trim().toLowerCase(), "hex");
  return got.length === expected.length && timingSafeEqual(got, expected);
}

/** Empreinte du corps brut : identifiant d'événement pour l'idempotence (HelloAsso n'en fournit pas de dédié). */
export const eventFingerprint = (rawBody: string) => createHash("sha256").update(rawBody).digest("hex");
