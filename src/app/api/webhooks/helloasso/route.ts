import { json, throttled, tooMany } from "@/lib/server/http";
import { safeEqual } from "@/lib/server/session";
import { verifySignature } from "@/lib/server/helloasso";
import { reconcile } from "@/lib/server/payments";

/**
 * Notification HelloAsso (à déclarer dans l'espace HelloAsso > Intégrations et API > Notifications, adresse :
 * https://votre-site/api/webhooks/helloasso?k=<HELLOASSO_WEBHOOK_SECRET>).
 * Défense en profondeur :
 *  1. jeton secret dans l'adresse (comparaison à temps constant) ;
 *  2. signature HMAC-SHA256 (en-tête x-ha-signature) vérifiée si HELLOASSO_SIGNATURE_KEY est défini ;
 *  3. le corps n'est qu'un déclencheur : le paiement est TOUJOURS relu chez HelloAsso avant toute écriture, à partir
 *     de l'identifiant enregistré par le site (un corps falsifié ne peut donc rien confirmer) ;
 *  4. traitement idempotent : une notification rejouée ne provoque aucun second effet.
 */
export async function POST(req: Request) {
  const secret = process.env.HELLOASSO_WEBHOOK_SECRET?.trim();
  if (!secret || secret.length < 16) return json({ error: "Webhook non configuré." }, 503);
  if (await throttled(req, "webhook", 300, 60_000)) return tooMany();
  if (!safeEqual(new URL(req.url).searchParams.get("k") ?? "", secret)) return json({ error: "Non autorisé." }, 401);
  if (Number(req.headers.get("content-length") ?? 0) > 512 * 1024) return json({ error: "Corps trop volumineux." }, 413);

  const raw = await req.text();
  const signatureKey = process.env.HELLOASSO_SIGNATURE_KEY?.trim();
  if (signatureKey && !verifySignature(raw, req.headers.get("x-ha-signature"), signatureKey)) return json({ error: "Signature invalide." }, 401);

  let body: { eventType?: string; metadata?: { kind?: string; ref?: string } };
  try {
    body = JSON.parse(raw);
  } catch {
    return json({ error: "Corps invalide." }, 400);
  }
  const kind = body.metadata?.kind;
  const ref = body.metadata?.ref;
  if ((body.eventType !== "Order" && body.eventType !== "Payment") || (kind !== "registration" && kind !== "order") || typeof ref !== "string" || !/^[\w-]{8,64}$/.test(ref)) {
    return json({ ok: true, ignored: true });
  }
  try {
    await reconcile(kind, ref);
  } catch {
    // Erreur transitoire (HelloAsso injoignable) : HelloAsso réessaiera ; le rattrapage planifié couvre aussi ce cas.
    return json({ error: "Traitement impossible pour le moment." }, 500);
  }
  return json({ ok: true });
}
