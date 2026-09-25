import { getEvent } from "@/lib/server/events";
import { getSession } from "@/lib/server/session";
import { json, siteUrl } from "@/lib/server/http";
import { listRegistrations, updateRegistration } from "@/lib/server/store";
import { createCheckoutSession, stripeConfigured } from "@/lib/server/stripe";

/** Relance le paiement d'une inscription en attente. */
export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const event = await getEvent(slug);
  const session = await getSession();
  if (!event || !session || session.role !== "member") return json({ error: "Non autorisé." }, 401);
  if (!stripeConfigured()) return json({ error: "Le paiement en ligne n'est pas encore activé." }, 503);
  const mine = (await listRegistrations(slug)).find((r) => r.memberNumber === session.memberNumber);
  if (!mine || mine.status !== "awaiting_payment") return json({ error: "Aucun paiement en attente." }, 404);
  try {
    const checkout = await createCheckoutSession({
      registrationId: mine.id,
      eventId: slug,
      eventTitle: event.title,
      unitAmountCents: event.registration.priceCents,
      quantity: mine.places,
      customerEmail: mine.email,
      siteUrl: siteUrl(req),
    });
    await updateRegistration(mine.id, { stripeSessionId: checkout.id });
    return json({ checkoutUrl: checkout.url });
  } catch {
    return json({ error: "Impossible d'initialiser le paiement." }, 502);
  }
}
