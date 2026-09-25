import "server-only";

/**
 * Paiement via Stripe Checkout (page hébergée par Stripe) : le site ne manipule jamais de numéro de carte.
 * Appels REST directs, sans SDK. Nécessite STRIPE_SECRET_KEY.
 */
export const stripeConfigured = () => Boolean(process.env.STRIPE_SECRET_KEY);

async function stripe<T>(pathname: string, init?: { method?: string; body?: URLSearchParams }): Promise<T> {
  const res = await fetch(`https://api.stripe.com/v1${pathname}`, {
    method: init?.method ?? "GET",
    headers: { Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`, ...(init?.body ? { "Content-Type": "application/x-www-form-urlencoded" } : {}) },
    body: init?.body,
    cache: "no-store",
  });
  const json = (await res.json()) as T & { error?: { message?: string } };
  if (!res.ok) throw new Error(json.error?.message ?? "Erreur Stripe");
  return json;
}

export async function createCheckoutSession(opts: {
  registrationId: string;
  eventId: string;
  eventTitle: string;
  /** Montant total à payer (après réduction éventuelle) */
  totalCents: number;
  places: number;
  customerEmail: string;
  siteUrl: string;
}) {
  const body = new URLSearchParams({
    mode: "payment",
    success_url: `${opts.siteUrl}/api/events/${opts.eventId}/confirm?registration=${opts.registrationId}&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${opts.siteUrl}/evenements/${opts.eventId}?paiement=annule#inscription`,
    customer_email: opts.customerEmail,
    client_reference_id: opts.registrationId,
    "line_items[0][quantity]": "1",
    "line_items[0][price_data][currency]": "eur",
    "line_items[0][price_data][unit_amount]": String(opts.totalCents),
    "line_items[0][price_data][product_data][name]": opts.places > 1 ? `${opts.eventTitle} (${opts.places} places)` : opts.eventTitle,
    "metadata[registration]": opts.registrationId,
    "metadata[event]": opts.eventId,
  });
  return stripe<{ id: string; url: string }>("/checkout/sessions", { method: "POST", body });
}

export const retrieveCheckoutSession = (id: string) =>
  stripe<{ id: string; payment_status: string; payment_intent?: string | null; metadata?: Record<string, string> }>(`/checkout/sessions/${encodeURIComponent(id)}`);

/** Rembourse intégralement le paiement d'une session Checkout (remboursement réel chez Stripe). */
export async function refundCheckoutSession(sessionId: string) {
  const session = await retrieveCheckoutSession(sessionId);
  if (session.payment_status !== "paid" || !session.payment_intent) throw new Error("Aucun paiement à rembourser pour cette session.");
  return stripe<{ id: string; status: string }>("/refunds", { method: "POST", body: new URLSearchParams({ payment_intent: session.payment_intent }) });
}

/** Réduction à usage unique appliquée à une session (montant fixe). */
async function createOneOffCoupon(amountOffCents: number, name: string) {
  return stripe<{ id: string }>("/coupons", { method: "POST", body: new URLSearchParams({ amount_off: String(amountOffCents), currency: "eur", duration: "once", name: name.slice(0, 40), max_redemptions: "1" }) });
}

export async function createShopCheckoutSession(opts: {
  orderId: string;
  token: string;
  lines: Array<{ name: string; unitAmountCents: number; quantity: number }>;
  discountCents?: number;
  discountLabel?: string;
  customerEmail: string;
  siteUrl: string;
}) {
  const body = new URLSearchParams({
    mode: "payment",
    success_url: `${opts.siteUrl}/api/shop/confirm?order=${opts.orderId}&t=${opts.token}&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${opts.siteUrl}/commande?paiement=annule`,
    customer_email: opts.customerEmail,
    client_reference_id: opts.orderId,
    "metadata[order]": opts.orderId,
  });
  opts.lines.forEach((l, i) => {
    body.set(`line_items[${i}][quantity]`, String(l.quantity));
    body.set(`line_items[${i}][price_data][currency]`, "eur");
    body.set(`line_items[${i}][price_data][unit_amount]`, String(l.unitAmountCents));
    body.set(`line_items[${i}][price_data][product_data][name]`, l.name);
  });
  if (opts.discountCents && opts.discountCents > 0) {
    const coupon = await createOneOffCoupon(opts.discountCents, opts.discountLabel ?? "Code promotionnel");
    body.set("discounts[0][coupon]", coupon.id);
  }
  return stripe<{ id: string; url: string }>("/checkout/sessions", { method: "POST", body });
}
