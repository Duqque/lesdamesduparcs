import { clientIp, json, throttled, tooMany } from "@/lib/server/http";
import { eventFingerprint, HELLOASSO_WEBHOOK_IPS, helloAssoConfig, verifySignature, type HelloAssoNotification } from "@/lib/server/helloasso";
import { logEvent } from "@/lib/server/log";
import { reconcile } from "@/lib/server/payments";
import { webhookEvents } from "@/lib/server/payment-records";
import { safeEqual } from "@/lib/server/session";

/**
 * Notification HelloAsso (à déclarer dans l'espace HelloAsso > Mon compte > Intégrations et API > Notifications, adresse :
 * https://votre-site/api/webhooks/helloasso?k=<HELLOASSO_WEBHOOK_SECRET>, types « Order » et « Payment »).
 *
 * Défense en profondeur :
 *  1. jeton secret dans l'adresse (comparaison à temps constant) ;
 *  2. (facultatif) HELLOASSO_WEBHOOK_ENFORCE_IP=1 : seules les adresses IP de HelloAsso sont acceptées ;
 *  3. signature HMAC-SHA256 (en-tête x-ha-signature) vérifiée si HELLOASSO_SIGNATURE_KEY est défini (réservée aux partenaires) ;
 *  4. le corps n'est qu'un déclencheur : le paiement est TOUJOURS relu chez HelloAsso avant toute écriture, à partir de
 *     l'identifiant enregistré par le site (un corps falsifié ne peut donc rien confirmer) ;
 *  5. idempotence : chaque notification est enregistrée (corps brut, empreinte) ; une notification rejouée, déjà traitée,
 *     ne provoque aucun second effet (ni paiement, ni adhésion, ni stock, ni e-mail).
 * HelloAsso rejoue une notification tant qu'il ne reçoit pas HTTP 200 (jusqu'à 48 h) : toute erreur transitoire répond 500.
 */
export async function POST(req: Request) {
  const cfg = helloAssoConfig();
  const secret = cfg.webhookSecret;
  if (!secret || secret.length < 16) return json({ error: "Webhook non configuré." }, 503);
  if (await throttled(req, "webhook", 300, 60_000)) return tooMany();
  if (!safeEqual(new URL(req.url).searchParams.get("k") ?? "", secret)) {
    logEvent("webhook_rejected", { reason: "jeton invalide" }, "warn");
    return json({ error: "Non autorisé." }, 401);
  }
  if (process.env.HELLOASSO_WEBHOOK_ENFORCE_IP === "1" && clientIp(req.headers) !== HELLOASSO_WEBHOOK_IPS[cfg.env]) {
    logEvent("webhook_rejected", { reason: "adresse IP non autorisée" }, "warn");
    return json({ error: "Non autorisé." }, 401);
  }
  if (Number(req.headers.get("content-length") ?? 0) > 512 * 1024) return json({ error: "Corps trop volumineux." }, 413);

  const raw = await req.text();
  if (cfg.signatureKey && !verifySignature(raw, req.headers.get("x-ha-signature"), cfg.signatureKey)) {
    logEvent("webhook_rejected", { reason: "signature invalide" }, "warn");
    return json({ error: "Signature invalide." }, 401);
  }

  let body: HelloAssoNotification;
  try {
    body = JSON.parse(raw);
  } catch {
    return json({ error: "Corps invalide." }, 400);
  }

  const kind = body.metadata?.kind;
  const ref = body.metadata?.ref;
  const fingerprint = eventFingerprint(raw);
  let event = await webhookEvents.findOne((e) => e.externalEventId === fingerprint);
  if (event?.processed) {
    logEvent("webhook_duplicate", { eventId: event.id, eventType: event.eventType, kind, ref });
    return json({ ok: true, duplicate: true });
  }
  if (!event) {
    event = await webhookEvents.insert({ externalEventId: fingerprint, eventType: String(body.eventType ?? "?"), kind: typeof kind === "string" ? kind : undefined, ref: typeof ref === "string" ? ref : undefined, payload: raw.slice(0, 100_000), processed: false, attempts: 0 });
    logEvent("webhook_received", { eventId: event.id, eventType: event.eventType, kind, ref });
  }

  const supported = (body.eventType === "Order" || body.eventType === "Payment") && (kind === "registration" || kind === "order" || kind === "membership") && typeof ref === "string" && /^[\w-]{8,64}$/.test(ref);
  if (!supported) {
    await webhookEvents.update(event.id, { processed: true, processedAt: new Date().toISOString(), result: "ignoré", attempts: event.attempts + 1 });
    return json({ ok: true, ignored: true });
  }
  try {
    const result = await reconcile(kind as "registration" | "order" | "membership", ref as string);
    await webhookEvents.update(event.id, { processed: true, processedAt: new Date().toISOString(), result, error: undefined, attempts: event.attempts + 1 });
    logEvent("webhook_processed", { eventId: event.id, kind, ref, result });
    return json({ ok: true, result });
  } catch (e) {
    // Erreur transitoire (HelloAsso injoignable…) : HelloAsso réessaiera ; le rattrapage planifié couvre aussi ce cas.
    await webhookEvents.update(event.id, { error: e instanceof Error ? e.message.slice(0, 300) : "erreur", attempts: event.attempts + 1 });
    logEvent("webhook_failed", { eventId: event.id, kind, ref, error: e instanceof Error ? e.message : "erreur" }, "error");
    return json({ error: "Traitement impossible pour le moment." }, 500);
  }
}
