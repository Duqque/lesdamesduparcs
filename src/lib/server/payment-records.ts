import "server-only";
import { collection, type Row } from "./db";
import type { CheckoutState, PaymentKind } from "./helloasso";

/**
 * Traces des échanges avec HelloAsso, dans la base du site (jamais de donnée bancaire) :
 *  - webhook_events : chaque notification reçue (corps brut conservé), avec son état de traitement (idempotence) ;
 *  - helloasso_payments : chaque paiement encaissé, relié à la commande / l'inscription / l'adhésion interne, unique par identifiant HelloAsso.
 */
export interface WebhookEvent extends Row {
  /** Empreinte SHA-256 du corps brut : deux notifications identiques ne sont traitées qu'une fois */
  externalEventId: string;
  eventType: string;
  kind?: string;
  ref?: string;
  /** Corps brut de la notification (JSON, tronqué à 100 000 caractères) */
  payload: string;
  processed: boolean;
  processedAt?: string;
  attempts: number;
  result?: string;
  error?: string;
}
export const webhookEvents = collection<WebhookEvent>("webhook_events");

export interface HelloAssoPayment extends Row {
  kind: PaymentKind;
  /** Identifiant de l'enregistrement interne (commande, inscription ou paiement d'adhésion) */
  ref: string;
  orderNumber?: string;
  checkoutIntentId: string;
  helloassoPaymentId: string;
  helloassoOrderId: string;
  amountCents: number;
  currency: "EUR";
  state: string;
  paidAt: string;
  memberNumber?: string;
  email?: string;
  refundedCents?: number;
  /** État complet renvoyé par HelloAsso au moment du rapprochement (aucune donnée bancaire) */
  rawPayload: string;
}
export const haPayments = collection<HelloAssoPayment>("helloasso_payments");

let chain: Promise<unknown> = Promise.resolve();
const serial = <T>(fn: () => Promise<T>): Promise<T> => {
  const run = chain.then(fn, fn);
  chain = run.catch(() => undefined);
  return run;
};

/** Enregistre un paiement encaissé (une seule ligne par identifiant de paiement HelloAsso). Renvoie la ligne, et `created` = première fois. */
export function recordHelloAssoPayment(opts: { kind: PaymentKind; ref: string; orderNumber?: string; memberNumber?: string; email?: string; checkout: CheckoutState }) {
  return serial(async () => {
    const pay = opts.checkout.order?.payments?.find((p) => p.state === "Authorized");
    const paymentId = String(pay?.id ?? `intent-${opts.checkout.id}`);
    const existing = await haPayments.findOne((p) => p.helloassoPaymentId === paymentId);
    if (existing) return { row: existing, created: false };
    const row = await haPayments.insert({
      kind: opts.kind,
      ref: opts.ref,
      orderNumber: opts.orderNumber,
      checkoutIntentId: opts.checkout.id,
      helloassoPaymentId: paymentId,
      helloassoOrderId: String(opts.checkout.order?.id ?? ""),
      amountCents: (pay?.amount ?? 0) - (pay?.amountTip ?? 0),
      currency: "EUR",
      state: pay?.state ?? "Authorized",
      paidAt: new Date().toISOString(),
      memberNumber: opts.memberNumber,
      email: opts.email,
      rawPayload: JSON.stringify(opts.checkout).slice(0, 20_000),
    });
    return { row, created: true };
  });
}
