import "server-only";
import { eur } from "@/lib/admin/format";
import { sendTemplate } from "./email";
import { getEvent } from "./events";
import { paidAmount, retrieveCheckout, paymentConfigured, type CheckoutState } from "./helloasso";
import { getOrder, getRegistration, listAllRegistrations, listOrders, updateOrder, updateRegistration } from "./store";

/**
 * Règlement des paiements en ligne, partagé par le retour navigateur, la notification (webhook) ET le rattrapage planifié :
 * mêmes contrôles, idempotent (un paiement confirmé plusieurs fois ne produit qu'une confirmation).
 * On ne fait confiance ni au navigateur, ni à l'URL, ni au corps d'une notification : l'intention de paiement est TOUJOURS relue
 * chez HelloAsso à partir de l'identifiant que NOUS avons enregistré, puis référence, montant et état sont revérifiés.
 */
export type Settled = "paid" | "already" | "mismatch" | "unpaid" | "unknown";

export async function settleRegistration(registrationId: string, checkout: CheckoutState): Promise<Settled> {
  const reg = await getRegistration(registrationId);
  if (!reg || !reg.checkoutId || reg.checkoutId !== checkout.id || checkout.metadata?.kind !== "registration" || checkout.metadata?.ref !== reg.id) return "unknown";
  const amount = paidAmount(checkout);
  if (amount === null) return "unpaid";
  if (amount !== reg.amountCents) return "mismatch";
  if (reg.status === "paid") return "already";
  if (reg.status === "cancelled" || reg.status === "refunded") return "mismatch";
  await updateRegistration(reg.id, { status: "paid" });
  await sendTemplate("payment", reg.email, { prenom: reg.firstName, montant: eur(reg.amountCents), objet: (await getEvent(reg.eventId))?.title ?? reg.eventId }, "paymentConfirmation");
  return "paid";
}

export async function settleOrder(orderId: string, checkout: CheckoutState): Promise<Settled> {
  const order = await getOrder(orderId);
  if (!order || !order.checkoutId || order.checkoutId !== checkout.id || checkout.metadata?.kind !== "order" || checkout.metadata?.ref !== order.id) return "unknown";
  const amount = paidAmount(checkout);
  if (amount === null) return "unpaid";
  if (amount !== order.totalCents) return "mismatch";
  if (order.status === "paid") return "already";
  if (order.status === "cancelled" || order.status === "refunded") return "mismatch";
  await updateOrder(order.id, { status: "paid", fulfilment: order.delivery.mode === "event" ? "ready_for_pickup" : "to_prepare" });
  await sendTemplate("order_paid", order.contact.email, { prenom: order.contact.firstName, objet: order.id.slice(0, 8).toUpperCase(), montant: eur(order.totalCents) }, "paymentConfirmation");
  return "paid";
}

/** Rapproche un enregistrement (inscription ou commande) avec HelloAsso à partir de SON identifiant de paiement enregistré. */
export async function reconcile(kind: "registration" | "order", refId: string): Promise<Settled> {
  const record = kind === "registration" ? await getRegistration(refId) : await getOrder(refId);
  if (!record?.checkoutId) return "unknown";
  const checkout = await retrieveCheckout(record.checkoutId);
  return kind === "registration" ? settleRegistration(refId, checkout) : settleOrder(refId, checkout);
}

/**
 * Rattrapage : une notification perdue ou arrivée avant l'enregistrement de l'identifiant ne doit jamais laisser un paiement
 * encaissé « en attente ». Toute inscription/commande en attente de paiement est relue chez HelloAsso.
 */
export async function reconcilePending() {
  if (!paymentConfigured()) return 0;
  let settled = 0;
  const [regs, orders] = await Promise.all([listAllRegistrations(), listOrders()]);
  for (const r of regs.filter((x) => x.status === "awaiting_payment" && x.checkoutId).slice(0, 50)) {
    try {
      if ((await reconcile("registration", r.id)) === "paid") settled++;
    } catch {
      /* HelloAsso injoignable : nouvel essai au prochain passage */
    }
  }
  for (const o of orders.filter((x) => x.status === "awaiting_payment" && x.checkoutId).slice(0, 50)) {
    try {
      if ((await reconcile("order", o.id)) === "paid") settled++;
    } catch {
      /* idem */
    }
  }
  return settled;
}
