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

/** Paiement (ou renouvellement) d'une adhésion : montant serveur, retour vérifié par /api/members/adhesion/confirm. */
export function startMembershipPayment(
  req: Request,
  pay: { id: string; amountCents: number; label: string },
  member: { firstName: string; lastName: string; email: string },
) {
  const site = siteUrl(req);
  return createCheckout({
    kind: "membership",
    refId: pay.id,
    itemName: `Adhésion ${pay.label}`,
    totalCents: pay.amountCents,
    payer: { firstName: member.firstName, lastName: member.lastName, email: member.email },
    returnUrl: `${site}/api/members/adhesion/confirm?payment=${encodeURIComponent(pay.id)}`,
    backUrl: `${site}/profil#adhesion`,
    errorUrl: `${site}/profil?adhesion=erreur#adhesion`,
  });
}

/**
 * Paiement d'une commande (produits et/ou adhésion) : montant serveur (articles + adhésion + livraison − réduction).
 * Le retour navigateur ne sert qu'à AFFICHER l'état ; la validation vient de la notification HelloAsso (et de la relecture serveur).
 */
export function startShopPayment(
  req: Request,
  order: { id: string; orderNumber?: string; token: string; totalCents: number; memberNumber?: string; membership?: { planName: string }; contact: { firstName: string; lastName: string; email: string }; lines: Array<{ name: string; size?: string; qty: number }> },
) {
  const site = siteUrl(req);
  const parts = [...(order.membership ? [order.membership.planName] : []), ...order.lines.map((l) => `${l.qty} × ${l.name}${l.size ? ` (${l.size})` : ""}`)];
  const q = `order=${encodeURIComponent(order.id)}&t=${encodeURIComponent(order.token)}`;
  return createCheckout({
    kind: "order",
    refId: order.id,
    itemName: `Les Dames du Parc ${order.orderNumber ?? ""} : ${parts.join(", ")}`.trim(),
    totalCents: order.totalCents,
    payer: { firstName: order.contact.firstName, lastName: order.contact.lastName, email: order.contact.email },
    returnUrl: `${site}/api/shop/confirm?${q}`,
    backUrl: `${site}/paiement/annule?${q}`,
    errorUrl: `${site}/paiement/erreur?${q}`,
    extra: { orderNumber: order.orderNumber, memberNumber: order.memberNumber },
  });
}
