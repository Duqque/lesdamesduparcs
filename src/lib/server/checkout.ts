import "server-only";
import { siteUrl } from "./http";
import { createCheckout } from "./helloasso";

/** Paiement d'une inscription à un événement : montant serveur, retour vérifié par /api/events/[slug]/confirm. */
export function startEventPayment(
  req: Request,
  reg: { id: string; firstName: string; lastName: string; email: string; amountCents: number; places: number },
  slug: string,
  eventTitle: string,
) {
  const site = siteUrl(req);
  return createCheckout({
    kind: "registration",
    refId: reg.id,
    itemName: reg.places > 1 ? `${eventTitle} (${reg.places} places)` : eventTitle,
    totalCents: reg.amountCents,
    payer: { firstName: reg.firstName, lastName: reg.lastName, email: reg.email },
    returnUrl: `${site}/api/events/${encodeURIComponent(slug)}/confirm?registration=${encodeURIComponent(reg.id)}`,
    backUrl: `${site}/evenements/${encodeURIComponent(slug)}#inscription`,
    errorUrl: `${site}/evenements/${encodeURIComponent(slug)}?paiement=erreur#inscription`,
  });
}

/** Paiement d'une commande de la boutique : montant serveur (articles + livraison − réduction). */
export function startShopPayment(
  req: Request,
  order: { id: string; token: string; totalCents: number; contact: { firstName: string; lastName: string; email: string }; lines: Array<{ name: string; size?: string; qty: number }> },
) {
  const site = siteUrl(req);
  const summary = order.lines.map((l) => `${l.qty} × ${l.name}${l.size ? ` (${l.size})` : ""}`).join(", ");
  return createCheckout({
    kind: "order",
    refId: order.id,
    itemName: `Boutique Les Dames du Parc : ${summary}`,
    totalCents: order.totalCents,
    payer: { firstName: order.contact.firstName, lastName: order.contact.lastName, email: order.contact.email },
    returnUrl: `${site}/api/shop/confirm?order=${encodeURIComponent(order.id)}&t=${encodeURIComponent(order.token)}`,
    backUrl: `${site}/panier`,
    errorUrl: `${site}/commande?paiement=erreur`,
  });
}
