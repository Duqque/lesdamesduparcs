import "server-only";
import { eur } from "@/lib/admin/format";
import { memberships, payments, type Payment } from "./business";
import { enqueueEmail, processEmailJobsSoon } from "./email-jobs";
import { sendTemplate } from "./email";
import { settings } from "./admin-store";
import { getEvent } from "./events";
import { isRefused, paidAmount, paymentConfigured, refundState, retrieveCheckout, type CheckoutState } from "./helloasso";
import { issueInvoice } from "./invoice";
import { logEvent } from "./log";
import { recordHelloAssoPayment } from "./payment-records";
import { releaseStock } from "./shop";
import { getMemberByNumber, getOrder, getRegistration, listAllRegistrations, listOrders, updateMember, updateOrder, updateRegistration } from "./store";
import type { Order } from "@/lib/orders";

/**
 * Règlement des paiements en ligne, partagé par le retour navigateur, la notification (webhook) ET le rattrapage planifié :
 * mêmes contrôles, idempotent (un paiement confirmé plusieurs fois ne produit qu'une seule fois : paiement enregistré, adhésion activée,
 * stock confirmé, e-mails mis en file).
 * On ne fait confiance ni au navigateur, ni à l'URL, ni au corps d'une notification : l'intention de paiement est TOUJOURS relue
 * chez HelloAsso à partir de l'identifiant que NOUS avons enregistré, puis référence, montant et état sont revérifiés.
 *
 * Ordre d'une validation : paiement enregistré > commande « payée » > stock confirmé > adhésion > facture > e-mails en file.
 * Les e-mails ne conditionnent jamais la validation : s'ils échouent, le paiement reste validé et l'e-mail reste « à envoyer ».
 */
export type Settled = "paid" | "already" | "mismatch" | "unpaid" | "unknown" | "refunded" | "failed";

/** Passe un paiement d'adhésion à « payé » (activation de l'adhésion) ; en cas de renouvellement, la carte et l'attestation changent de saison. */
export async function markMembershipPaid(pay: Payment, extra: Partial<Payment>): Promise<void> {
  await payments.update(pay.id, { status: "paid", method: "online", paidAt: new Date().toISOString(), ...extra });
  const ms = pay.membershipId ? await memberships.findOne((m) => m.id === pay.membershipId) : null;
  const member = pay.memberNumber ? await getMemberByNumber(pay.memberNumber) : null;
  if (ms && member && ms.renewal) await updateMember(member.id, { season: ms.season, validUntil: ms.endsAt.slice(0, 10) });
  logEvent("membership_activated", { memberNumber: pay.memberNumber, membershipId: pay.membershipId, season: ms?.season });
  // Nouvelle adhérente : e-mail de bienvenue (désactivable dans Communication > Automatisations) ; renouvellement : simple confirmation.
  if (member && ms && (ms.renewal || (await settings.get()).automations.membershipWelcome)) {
    await enqueueEmail({
      type: "MEMBERSHIP_CONFIRMATION",
      recipient: member.email,
      dedupeKey: `MEMBERSHIP_CONFIRMATION:${ms.id}`,
      memberNumber: member.memberNumber,
      payload: { firstName: member.firstName, memberNumber: member.memberNumber, season: ms.season, startDate: ms.startsAt, endDate: ms.endsAt, renewal: Boolean(ms.renewal) },
    });
  }
}

export async function settleRegistration(registrationId: string, checkout: CheckoutState): Promise<Settled> {
  const reg = await getRegistration(registrationId);
  if (!reg || !reg.checkoutId || reg.checkoutId !== checkout.id || checkout.metadata?.kind !== "registration" || checkout.metadata?.ref !== reg.id) return "unknown";
  if (refundState(checkout).refunded) {
    if (reg.status !== "refunded") {
      await updateRegistration(reg.id, { status: "refunded" });
      logEvent("order_refunded", { kind: "registration", ref: reg.id });
    }
    return "refunded";
  }
  const amount = paidAmount(checkout);
  if (amount === null) return isRefused(checkout) ? "failed" : "unpaid";
  if (amount !== reg.amountCents) {
    logEvent("payment_refused", { kind: "registration", ref: reg.id, reason: "montant incorrect", expected: reg.amountCents, received: amount }, "warn");
    return "mismatch";
  }
  if (reg.status === "paid") return "already";
  if (reg.status === "cancelled" || reg.status === "refunded") return "mismatch";
  await recordHelloAssoPayment({ kind: "registration", ref: reg.id, memberNumber: reg.memberNumber, email: reg.email, checkout });
  await updateRegistration(reg.id, { status: "paid" });
  logEvent("order_paid", { kind: "registration", ref: reg.id, amountCents: amount });
  const event = await getEvent(reg.eventId);
  await enqueueEmail({
    type: "EVENT_CONFIRMATION",
    recipient: reg.email,
    dedupeKey: `EVENT_CONFIRMATION:${reg.id}`,
    memberNumber: reg.memberNumber,
    payload: { firstName: reg.firstName, eventTitle: event?.title ?? reg.eventId, date: event?.date ?? "", time: event?.time, venue: event?.venue ?? "", address: event?.address, places: reg.places, amountCents: reg.amountCents, practical: event?.practical ?? [] },
  });
  // Facture (et e-mail de validation du paiement avec la facture en pièce jointe) ; à défaut, l'ancien e-mail de confirmation.
  if (!(await issueInvoice(`registration:${reg.id}`))) await sendTemplate("payment", reg.email, { prenom: reg.firstName, montant: eur(reg.amountCents), objet: event?.title ?? reg.eventId }, "paymentConfirmation");
  processEmailJobsSoon();
  return "paid";
}

/** Commande refusée par la banque : « échouée », nouvel essai possible (le stock reste réservé quelque temps). */
export async function markOrderFailed(order: Order, reason: string) {
  if (order.status !== "awaiting_payment") return;
  await updateOrder(order.id, { status: "failed" });
  logEvent("order_failed", { orderId: order.id, orderNumber: order.orderNumber, reason }, "warn");
  await enqueueEmail({
    type: "PAYMENT_FAILED",
    recipient: order.contact.email,
    dedupeKey: `PAYMENT_FAILED:${order.id}:${order.attempts ?? 1}`,
    orderId: order.id,
    payload: { firstName: order.contact.firstName, orderNumber: order.orderNumber ?? order.id.slice(0, 8), retryPath: `/paiement/retour?order=${order.id}&t=${order.token}` },
  });
  processEmailJobsSoon();
}

export async function settleOrder(orderId: string, checkout: CheckoutState): Promise<Settled> {
  const order = await getOrder(orderId);
  if (!order || !order.checkoutId || order.checkoutId !== checkout.id || checkout.metadata?.kind !== "order" || checkout.metadata?.ref !== order.id) return "unknown";
  const rs = refundState(checkout);
  if (rs.refunded) {
    if (order.status === "paid" || order.status === "partially_refunded") {
      const next = rs.partial ? "partially_refunded" : "refunded";
      if (order.status !== next) {
        await updateOrder(order.id, { status: next, refundedCents: rs.refundedCents || order.totalCents });
        if (next === "refunded") await releaseStock(order.lines);
        logEvent("order_refunded", { orderId: order.id, orderNumber: order.orderNumber, partial: rs.partial });
      }
    }
    return "refunded";
  }
  const amount = paidAmount(checkout);
  if (amount === null) {
    if (isRefused(checkout)) {
      await markOrderFailed(order, "paiement refusé");
      return "failed";
    }
    return "unpaid";
  }
  if (amount !== order.totalCents) {
    logEvent("payment_refused", { orderId: order.id, orderNumber: order.orderNumber, reason: "montant incorrect", expected: order.totalCents, received: amount }, "warn");
    return "mismatch";
  }
  if (order.status === "paid") return "already";
  if (order.status === "cancelled" || order.status === "refunded") return "mismatch";
  // 1) paiement, 2) commande « payée », 3) stock (déjà réservé à la commande : confirmé ici), 4) adhésion, 5) facture, 6) e-mails en file.
  const { created } = await recordHelloAssoPayment({ kind: "order", ref: order.id, orderNumber: order.orderNumber, memberNumber: order.memberNumber, email: order.contact.email, checkout });
  logEvent("payment_created", { orderId: order.id, orderNumber: order.orderNumber, amountCents: amount, duplicate: !created });
  // Deux traitements simultanés (notification + retour navigateur) : le second constate que la commande est déjà payée.
  if (!created && (await getOrder(order.id))?.status === "paid") return "already";
  await updateOrder(order.id, { status: "paid", paidAt: new Date().toISOString(), fulfilment: order.delivery.mode === "event" ? "ready_for_pickup" : "to_prepare" });
  logEvent("order_paid", { orderId: order.id, orderNumber: order.orderNumber, amountCents: amount });
  if (order.lines.length) logEvent("stock_confirmed", { orderId: order.id, lines: order.lines.map((l) => ({ productId: l.productId, size: l.size, qty: l.qty })) });
  if (order.membership) {
    const pay = await payments.findOne((p) => p.id === order.membership!.paymentId);
    if (pay && pay.status !== "paid") await markMembershipPaid(pay, { viaOrderId: order.id, checkoutId: checkout.id });
  }
  await enqueueEmail({
    type: "ORDER_CONFIRMATION",
    recipient: order.contact.email,
    dedupeKey: `ORDER_CONFIRMATION:${order.id}`,
    orderId: order.id,
    memberNumber: order.memberNumber,
    payload: {
      firstName: order.contact.firstName,
      orderNumber: order.orderNumber ?? order.id.slice(0, 8).toUpperCase(),
      paidAt: new Date().toISOString(),
      lines: order.lines.map((l) => ({ name: l.name, size: l.size, qty: l.qty, unitCents: l.unitCents })),
      membership: order.membership ? { planName: order.membership.planName, amountCents: order.membership.amountCents } : undefined,
      subtotalCents: order.subtotalCents,
      discountCents: order.discountCents ?? 0,
      promoCode: order.promoCode,
      shippingCents: order.shippingCents,
      totalCents: order.totalCents,
    },
  });
  await issueInvoice(`order:${order.id}`);
  processEmailJobsSoon();
  return "paid";
}

export async function settleMembership(paymentId: string, checkout: CheckoutState): Promise<Settled> {
  const pay = await payments.findOne((p) => p.id === paymentId);
  if (!pay || pay.kind !== "adhesion" || !pay.checkoutId || pay.checkoutId !== checkout.id || checkout.metadata?.kind !== "membership" || checkout.metadata?.ref !== pay.id) return "unknown";
  if (refundState(checkout).refunded) {
    if (pay.status === "paid") {
      await payments.update(pay.id, { status: "refunded" });
      logEvent("order_refunded", { kind: "membership", ref: pay.id });
    }
    return "refunded";
  }
  const amount = paidAmount(checkout);
  if (amount === null) return isRefused(checkout) ? "failed" : "unpaid";
  if (amount !== pay.amountCents) {
    logEvent("payment_refused", { kind: "membership", ref: pay.id, reason: "montant incorrect", expected: pay.amountCents, received: amount }, "warn");
    return "mismatch";
  }
  if (pay.status === "paid") return "already";
  if (pay.status === "cancelled" || pay.status === "refunded") return "mismatch";
  await recordHelloAssoPayment({ kind: "membership", ref: pay.id, memberNumber: pay.memberNumber, email: pay.email, checkout });
  await markMembershipPaid(pay, {});
  logEvent("order_paid", { kind: "membership", ref: pay.id, amountCents: amount });
  await issueInvoice(`payment:${pay.id}`);
  processEmailJobsSoon();
  return "paid";
}

/** Rapproche un enregistrement (inscription, commande ou adhésion) avec HelloAsso à partir de SON identifiant de paiement enregistré. */
export async function reconcile(kind: "registration" | "order" | "membership", refId: string): Promise<Settled> {
  const record = kind === "registration" ? await getRegistration(refId) : kind === "order" ? await getOrder(refId) : await payments.findOne((p) => p.id === refId);
  if (!record?.checkoutId) return "unknown";
  const checkout = await retrieveCheckout(record.checkoutId);
  const result = kind === "registration" ? await settleRegistration(refId, checkout) : kind === "order" ? await settleOrder(refId, checkout) : await settleMembership(refId, checkout);
  logEvent("reconcile", { kind, ref: refId, result });
  return result;
}

/**
 * Rattrapage : une notification perdue ou arrivée avant l'enregistrement de l'identifiant ne doit jamais laisser un paiement
 * encaissé « en attente ». Toute inscription/commande/adhésion en attente de paiement est relue chez HelloAsso.
 * (Une intention de paiement HelloAsso est abandonnée au bout de 45 minutes sans paiement.)
 */
export async function reconcilePending() {
  if (!paymentConfigured()) return 0;
  let settled = 0;
  const [regs, orders, pays] = await Promise.all([listAllRegistrations(), listOrders(), payments.find((p) => p.kind === "adhesion" && p.status === "pending" && !!p.checkoutId)]);
  for (const p of pays.slice(0, 50)) {
    try {
      if ((await reconcile("membership", p.id)) === "paid") settled++;
    } catch {
      /* HelloAsso injoignable : nouvel essai au prochain passage */
    }
  }
  for (const r of regs.filter((x) => x.status === "awaiting_payment" && x.checkoutId).slice(0, 50)) {
    try {
      if ((await reconcile("registration", r.id)) === "paid") settled++;
    } catch {
      /* idem */
    }
  }
  for (const o of orders.filter((x) => (x.status === "awaiting_payment" || x.status === "failed") && x.checkoutId).slice(0, 50)) {
    try {
      if ((await reconcile("order", o.id)) === "paid") settled++;
    } catch {
      /* idem */
    }
  }
  return settled;
}
