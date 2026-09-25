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
  unitAmountCents: number;
  quantity: number;
  customerEmail: string;
  siteUrl: string;
}) {
  const body = new URLSearchParams({
    mode: "payment",
    success_url: `${opts.siteUrl}/api/events/${opts.eventId}/confirm?registration=${opts.registrationId}&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${opts.siteUrl}/evenements/${opts.eventId}?paiement=annule#inscription`,
    customer_email: opts.customerEmail,
    client_reference_id: opts.registrationId,
    "line_items[0][quantity]": String(opts.quantity),
    "line_items[0][price_data][currency]": "eur",
    "line_items[0][price_data][unit_amount]": String(opts.unitAmountCents),
    "line_items[0][price_data][product_data][name]": opts.eventTitle,
    "metadata[registration]": opts.registrationId,
    "metadata[event]": opts.eventId,
  });
  return stripe<{ id: string; url: string }>("/checkout/sessions", { method: "POST", body });
}

export const retrieveCheckoutSession = (id: string) =>
  stripe<{ id: string; payment_status: string; metadata?: Record<string, string> }>(`/checkout/sessions/${encodeURIComponent(id)}`);
