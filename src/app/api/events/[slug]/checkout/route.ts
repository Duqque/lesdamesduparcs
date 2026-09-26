import { getEvent } from "@/lib/server/events";
import { getSession } from "@/lib/server/session";
import { json, siteUrl } from "@/lib/server/http";
import { listRegistrations, updateRegistration } from "@/lib/server/store";
import { paymentConfigured } from "@/lib/server/helloasso";
import { startEventPayment } from "@/lib/server/checkout";

/** Lance ou relance le paiement en ligne d'une inscription (en attente de paiement, ou confirmée avec paiement facultatif). */
export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const event = await getEvent(slug);
  const session = await getSession();
  if (!event || !session || session.role !== "member") return json({ error: "Non autorisé." }, 401);
  if (!paymentConfigured()) return json({ error: "Le paiement en ligne n'est pas encore activé." }, 503);
  const mode = event.registration.paymentMode ?? "online";
  if (mode === "onsite" || mode === "manual" || mode === "none") return json({ error: "Ce paiement ne se fait pas en ligne." }, 400);
  const mine = (await listRegistrations(slug)).find((r) => r.memberNumber === session.memberNumber && (r.status === "awaiting_payment" || (r.status === "confirmed" && r.amountCents > 0)));
  if (!mine) return json({ error: "Aucun paiement en attente." }, 404);
  try {
    const checkout = await startEventPayment(req, { id: mine.id, firstName: mine.firstName, lastName: mine.lastName, email: mine.email, amountCents: mine.amountCents, places: mine.places }, slug, event.title);
    await updateRegistration(mine.id, { checkoutId: checkout.id });
    return json({ checkoutUrl: checkout.url });
  } catch {
    return json({ error: "Impossible d'initialiser le paiement." }, 502);
  }
}
