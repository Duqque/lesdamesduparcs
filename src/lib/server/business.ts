import "server-only";
import { randomUUID } from "node:crypto";
import { adhesion as adhesionCopy } from "@/data/adhesion";
import type { MemberPublic } from "@/lib/members";
import { seasonOf } from "@/lib/season";
import type { RegistrationStatus } from "@/lib/registration";
import type { Order } from "@/lib/orders";
import { collection, type Row } from "./db";
import { getMemberById, listAllRegistrations, listOrders, listStoredMembers, updateMember, updateOrder, updateRegistration } from "./store";
import { releaseStock } from "./shop";
import { paymentConfigured, refundCheckout } from "./helloasso";
import { getAllEventsAdmin } from "./events";
import { settings } from "./admin-store";

/* ---------- Formules d'adhésion ---------- */

export interface Plan extends Row {
  name: string;
  description: string;
  priceCents: number;
  promoPriceCents?: number;
  /** 0 = durée de la saison (1er septembre au 31 août) */
  durationMonths: number;
  image?: string;
  benefits: string[];
  conditions: string;
  visible: boolean;
  available: boolean;
  autoRenew: boolean;
  order: number;
}

export const plans = collection<Plan>("plans", () => [
  {
    id: "saison",
    name: "Adhésion saison",
    description: "Membre officielle des Dames du Parc pour toute la saison.",
    priceCents: 1200,
    durationMonths: 0,
    benefits: adhesionCopy.benefits.map((b) => b.title),
    conditions: "Valable pour la saison en cours. Renouvellement à chaque saison.",
    visible: true,
    available: true,
    autoRenew: false,
    order: 1,
  },
]);

export const activePrice = (p: Plan) => p.promoPriceCents ?? p.priceCents;

export async function defaultPlan() {
  const all = (await plans.all()).filter((p) => p.visible && p.available).sort((a, b) => a.order - b.order);
  return all[0] ?? (await plans.all())[0] ?? null;
}

/* ---------- Adhésions (historique par saison) et paiements ---------- */

export type MembershipStatus = "active" | "suspended" | "cancelled";

export interface Membership extends Row {
  memberId: string;
  memberNumber: string;
  planId: string;
  planName: string;
  season: string;
  startsAt: string;
  endsAt: string;
  amountCents: number;
  status: MembershipStatus;
  renewal: boolean;
  renewedFromId?: string;
}

export type TxStatus = "paid" | "pending" | "failed" | "refunded" | "cancelled";
export type PayMethod = "online" | "cash" | "virement" | "cheque" | "manual" | "autre";

export interface Payment extends Row {
  memberNumber?: string;
  name: string;
  email?: string;
  kind: "adhesion" | "other";
  label: string;
  amountCents: number;
  method: PayMethod;
  status: TxStatus;
  reference: string;
  paidAt?: string;
  note?: string;
  membershipId?: string;
  /** Identifiant de l'intention de paiement HelloAsso (adhésion réglée en ligne) */
  checkoutId?: string;
  /** Adhésion réglée dans une commande mixte (adhésion + produits) : le paiement est celui de la commande, non compté deux fois */
  viaOrderId?: string;
  /** Code promotionnel appliqué à l'adhésion : prix de la formule avant réduction, code et réduction accordée */
  baseCents?: number;
  promoCode?: string;
  discountCents?: number;
  /** La personne a choisi de payer plus tard (espèces, chèque…) : validation manuelle par l'équipe */
  deferredAt?: string;
  /** Dernier rappel envoyé (7 ou 15 jours après la création du compte) */
  reminderSent?: 7 | 15;
}

export const memberships = collection<Membership>("memberships");
export const payments = collection<Payment>("payments");

export const effectiveStatus = (m: Membership, now = new Date()): "active" | "expired" | "suspended" | "cancelled" =>
  m.status === "active" ? (new Date(m.endsAt).getTime() < now.getTime() ? "expired" : "active") : m.status;

/** Crée l'adhésion (et son paiement) d'une adhérente pour une formule donnée. */
export async function createMembership(member: MemberPublic, plan: Plan, opts?: { paid?: boolean; method?: PayMethod; renewedFromId?: string; startsAt?: Date }) {
  const start = opts?.startsAt ?? new Date(member.joinedAt);
  const season = seasonOf(start);
  const endsAt = plan.durationMonths ? new Date(new Date(start).setMonth(start.getMonth() + plan.durationMonths)).toISOString() : `${season.validUntil}T23:59:59.000Z`;
  const amount = activePrice(plan);
  const ms = await memberships.insert({
    memberId: member.id,
    memberNumber: member.memberNumber,
    planId: plan.id,
    planName: plan.name,
    season: season.label,
    startsAt: start.toISOString(),
    endsAt,
    amountCents: amount,
    status: "active",
    renewal: Boolean(opts?.renewedFromId),
    renewedFromId: opts?.renewedFromId,
  });
  const payment = await payments.insert({
    memberNumber: member.memberNumber,
    name: `${member.firstName} ${member.lastName}`,
    email: member.email,
    kind: "adhesion",
    label: `${plan.name} ${season.label}`,
    amountCents: amount,
    method: opts?.method ?? "manual",
    status: amount === 0 || opts?.paid ? "paid" : "pending",
    reference: `ADH-${randomUUID().slice(0, 8).toUpperCase()}`,
    paidAt: amount === 0 || opts?.paid ? new Date().toISOString() : undefined,
    membershipId: ms.id,
  });
  // Adhésion réglée dès sa création (saisie par l'équipe, formule gratuite) : carte valide, e-mail de confirmation et facture (même à 0 €).
  if (payment.status === "paid") {
    await (await import("./payments")).markMembershipPaid(payment, {});
    await (await import("./invoice")).issueInvoice(`payment:${payment.id}`);
  }
  return ms;
}

/** Rattache automatiquement les adhérentes existantes à une adhésion et à un paiement (données créées avant le back-office). */
export async function syncMemberships() {
  const [members, existing, plan] = await Promise.all([listStoredMembers(), memberships.all(), defaultPlan()]);
  if (!plan) return;
  const has = new Set(existing.map((m) => m.memberId));
  for (const m of members) if (!has.has(m.id)) await createMembership(m, plan);
}

export async function membershipsOf(memberId: string) {
  return (await memberships.find((m) => m.memberId === memberId)).sort((a, b) => b.startsAt.localeCompare(a.startsAt));
}

export async function currentMembership(memberId: string) {
  return (await membershipsOf(memberId))[0] ?? null;
}

export const paymentOfMembership = (membershipId: string) => payments.findOne((p) => p.membershipId === membershipId && p.kind === "adhesion");

/**
 * État de l'abonnement d'une adhérente, pour les appels à l'action du site :
 *  - active : adhésion en cours ET réglée (les CTA d'adhésion disparaissent) ;
 *  - pending : adhésion créée mais pas encore réglée (« Finaliser mon adhésion ») ;
 *  - expired : saison terminée, annulée ou remboursée (« Renouveler mon adhésion ») ;
 *  - none : aucune adhésion enregistrée ; suspended : compte suspendu (aucun CTA).
 */
export type MembershipState = "active" | "pending" | "expired" | "none" | "suspended" | "expelled";
export async function membershipState(memberId: string): Promise<MembershipState> {
  await reinstateDue();
  const member = await getMemberById(memberId);
  if (member?.status === "expelled") return "expelled";
  if (member?.status === "suspended") return "suspended";
  const ms = await currentMembership(memberId);
  if (!ms) return "none";
  const eff = effectiveStatus(ms);
  if (eff === "suspended") return "suspended";
  if (eff !== "active") return "expired";
  const pay = await paymentOfMembership(ms.id);
  if (!pay || pay.status === "paid") return "active";
  return pay.status === "pending" || pay.status === "failed" ? "pending" : "expired";
}

/* ---------- Plafond de la première vague d'adhésions ---------- */

export const ADHESION_CAP_MESSAGE = "Les adhésions pour cette saison sont actuellement complètes. Une nouvelle vague d'adhésions ouvrira ultérieurement. Restez connectées à nos réseaux sociaux pour être informées de la réouverture. 🔴🔵";

/** Une adhésion compte-t-elle encore ? Réglée (ou offerte), pas annulée. */
const countsMembership = (m: Membership, payByMs: Map<string, Payment>) => m.status !== "cancelled" && (m.amountCents === 0 || payByMs.get(m.id)?.status === "paid");

/** Une adhérente a-t-elle déjà réglé (ou obtenu gratuitement) au moins une adhésion, un jour ? Détermine si elle « renouvelle » (jamais bloquée par le plafond) ou « rejoint » (soumise au plafond). */
export async function hasPaidMembership(memberId: string): Promise<boolean> {
  const [ms, pays] = await Promise.all([membershipsOf(memberId), payments.all()]);
  const payByMs = new Map(pays.filter((p): p is Payment & { membershipId: string } => Boolean(p.membershipId)).map((p) => [p.membershipId, p]));
  return ms.some((m) => countsMembership(m, payByMs));
}

/**
 * Nombre d'adhérentes distinctes ayant une adhésion « active » au sens du plafond : réglée ou offerte, ni annulée, ni le
 * compte effacé (RGPD). Les adhésions annulées et les comptes supprimés libèrent leur place.
 */
export async function paidAdhesionCount(): Promise<number> {
  const [ms, pays, members] = await Promise.all([memberships.all(), payments.all(), listStoredMembers()]);
  const payByMs = new Map(pays.filter((p): p is Payment & { membershipId: string } => Boolean(p.membershipId)).map((p) => [p.membershipId, p]));
  const liveMemberIds = new Set(members.filter((m) => m.status !== "anonymized").map((m) => m.id));
  const ids = new Set(ms.filter((m) => liveMemberIds.has(m.memberId) && countsMembership(m, payByMs)).map((m) => m.memberId));
  return ids.size;
}

/**
 * État de la campagne d'adhésions (Adhérentes > Campagne d'adhésions) : ouvertes par défaut, jusqu'à `limit` adhésions
 * réglées ou offertes au total ; `paused` les ferme entièrement, quel que soit le nombre. Jamais bloquant pour un
 * renouvellement (voir hasPaidMembership). Augmenter `limit` rouvre aussitôt les adhésions.
 */
export async function adhesionCapStatus() {
  const { adhesions } = await settings.get();
  if (adhesions.paused) return { blocked: true, limit: adhesions.limit, count: 0, remaining: 0 };
  const count = await paidAdhesionCount();
  const remaining = Math.max(0, adhesions.limit - count);
  return { blocked: remaining <= 0, limit: adhesions.limit, count, remaining };
}

let lastReinstate = 0;
/**
 * Fin des suspensions provisoires : à la date choisie, l'adhésion est rétablie automatiquement et la personne en est informée par e-mail.
 * Déclenché à la lecture (au plus une fois par minute) et par la tâche planifiée.
 */
export async function reinstateDue(force = false) {
  if (!force && Date.now() - lastReinstate < 60_000) return 0;
  lastReinstate = Date.now();
  const today = new Date().toISOString().slice(0, 10);
  let n = 0;
  for (const m of await listStoredMembers()) {
    if (m.status !== "suspended" || !m.suspendedUntil || m.suspendedUntil > today) continue;
    await updateMember(m.id, { status: undefined, suspendedUntil: undefined, statusReason: undefined, statusAt: new Date().toISOString() });
    const cur = await currentMembership(m.id);
    if (cur && cur.status === "suspended") await memberships.update(cur.id, { status: "active" });
    const { sendTemplate } = await import("./email");
    await sendTemplate("member_reinstated", m.email, { prenom: m.firstName, contact: (await (await import("./admin-store")).settings.get()).association.email });
    n++;
  }
  return n;
}

/** Nouvelle adhésion (renouvellement) pour la saison en cours, réglée ensuite en ligne ou auprès de l'association. */
export async function renewMembership(member: MemberPublic) {
  const plan = await defaultPlan();
  if (!plan) return null;
  const prev = await currentMembership(member.id);
  return createMembership(member, plan, { renewedFromId: prev?.id, startsAt: new Date() });
}

/* ---------- Transactions unifiées (adhésions, événements, boutique) ---------- */

export interface Tx {
  id: string;
  source: "payment" | "registration" | "order";
  rowId: string;
  at: string;
  name: string;
  email?: string;
  memberNumber?: string;
  type: "Adhésion" | "Événement" | "Boutique" | "Autre";
  label: string;
  eventId?: string;
  amountCents: number;
  method: string;
  status: TxStatus;
  reference: string;
}

const regStatusToTx = (s: RegistrationStatus, amount: number): TxStatus | null =>
  s === "paid" ? "paid" : s === "awaiting_payment" ? "pending" : s === "cancelled" ? "cancelled" : s === "refunded" ? "refunded" : s === "confirmed" && amount > 0 ? "pending" : null;

const orderStatusToTx = (s: Order["status"]): TxStatus => (s === "paid" ? "paid" : s === "awaiting_payment" ? "pending" : s === "partially_refunded" ? "refunded" : s);

export async function getTransactions(): Promise<Tx[]> {
  const [pays, regs, orders, evs] = await Promise.all([payments.all(), listAllRegistrations(), listOrders(), getAllEventsAdmin()]);
  const title = (id: string) => evs.find((e) => e.id === id)?.title ?? id;
  const out: Tx[] = [];
  for (const p of pays.filter((x) => !x.viaOrderId))
    out.push({
      id: `payment:${p.id}`, source: "payment", rowId: p.id, at: p.paidAt ?? p.createdAt, name: p.name, email: p.email, memberNumber: p.memberNumber,
      type: p.kind === "adhesion" ? "Adhésion" : "Autre", label: p.label, amountCents: p.amountCents, method: methodLabel(p.method), status: p.status, reference: p.reference,
    });
  for (const r of regs) {
    const st = regStatusToTx(r.status, r.amountCents);
    if (!st || r.amountCents <= 0) continue;
    out.push({
      id: `registration:${r.id}`, source: "registration", rowId: r.id, at: r.createdAt, name: `${r.firstName} ${r.lastName}`, email: r.email, memberNumber: r.memberNumber,
      type: "Événement", label: title(r.eventId), eventId: r.eventId, amountCents: r.amountCents, method: r.checkoutId ? "Carte (HelloAsso)" : "À définir", status: st, reference: r.checkoutId?.slice(-10) ?? r.id.slice(0, 8).toUpperCase(),
    });
  }
  for (const o of orders)
    out.push({
      id: `order:${o.id}`, source: "order", rowId: o.id, at: o.createdAt, name: `${o.contact.firstName} ${o.contact.lastName}`, email: o.contact.email, memberNumber: o.memberNumber,
      type: "Boutique", label: o.lines.map((l) => `${l.qty} × ${l.name}`).join(", "), amountCents: o.totalCents, method: o.checkoutId ? "Carte (HelloAsso)" : "À définir", status: orderStatusToTx(o.status), reference: o.id.slice(0, 8).toUpperCase(),
    });
  return out.sort((a, b) => b.at.localeCompare(a.at));
}

export const methodLabel = (m: PayMethod) => ({ online: "Carte (HelloAsso)", cash: "Espèces", virement: "Virement", cheque: "Chèque", manual: "À définir", autre: "Autre" })[m];

export const TX_STATUS_LABEL: Record<TxStatus, string> = { paid: "Payé", pending: "En attente", failed: "Échoué", refunded: "Remboursé", cancelled: "Annulé" };

/** Change le statut d'une transaction, quel que soit son système d'origine. Un remboursement passe par HelloAsso quand le paiement a été fait en ligne. */
export async function setTxStatus(txId: string, status: TxStatus, opts?: { method?: PayMethod; note?: string; skipRefund?: boolean }): Promise<{ ok: true } | { ok: false; error: string }> {
  const [source, rowId] = txId.split(":");
  const refund = async (checkoutId?: string) => {
    if (status !== "refunded" || !checkoutId || !paymentConfigured() || opts?.skipRefund) return null;
    try {
      await refundCheckout(checkoutId);
      return null;
    } catch (e) {
      return e instanceof Error ? e.message : "Remboursement impossible.";
    }
  };
  if (source === "payment") {
    const pay = await payments.findOne((p) => p.id === rowId);
    const err = pay?.status === "paid" ? await refund(pay.checkoutId) : null;
    if (err) return { ok: false, error: `Remboursement HelloAsso impossible : ${err}. Effectuez-le depuis votre espace HelloAsso, puis marquez la transaction comme remboursée.` };
    await payments.update(rowId, { status, method: opts?.method, note: opts?.note, paidAt: status === "paid" ? new Date().toISOString() : undefined });
    // Validation manuelle d'une adhésion (espèces, chèque, virement…) : la carte devient valide, la membre en est informée par e-mail.
    if (status === "paid" && pay?.kind === "adhesion") await (await import("./payments")).markMembershipPaid({ ...pay, status: "paid" }, { method: opts?.method ?? pay.method });
    if (status === "paid") await (await import("./invoice")).issueInvoice(txId);
    return { ok: true };
  }
  if (source === "registration") {
    const reg = (await listAllRegistrations()).find((r) => r.id === rowId);
    const err = reg?.status === "paid" ? await refund(reg.checkoutId) : null;
    if (err) return { ok: false, error: `Remboursement HelloAsso impossible : ${err}. Effectuez-le depuis votre espace HelloAsso, puis marquez la transaction comme remboursée.` };
    const map: Record<TxStatus, RegistrationStatus> = { paid: "paid", pending: "awaiting_payment", failed: "awaiting_payment", refunded: "refunded", cancelled: "cancelled" };
    await updateRegistration(rowId, { status: map[status] });
    if (status === "paid") await (await import("./invoice")).issueInvoice(txId);
    return { ok: true };
  }
  if (source === "order") {
    const order = (await listOrders()).find((o) => o.id === rowId);
    const err = order?.status === "paid" ? await refund(order.checkoutId) : null;
    if (err) return { ok: false, error: `Remboursement HelloAsso impossible : ${err}. Effectuez-le depuis votre espace HelloAsso, puis marquez la transaction comme remboursée.` };
    const map: Record<TxStatus, Order["status"]> = { paid: "paid", pending: "awaiting_payment", failed: "failed", refunded: "refunded", cancelled: "cancelled" };
    const next = map[status];
    const wasOut = order?.status === "cancelled" || order?.status === "refunded";
    const goingOut = next === "cancelled" || next === "refunded";
    if (order && goingOut && !wasOut) {
      await releaseStock(order.lines);
      // Commande jamais réglée : l'utilisation du code promotionnel est libérée.
      if (order.promoCode && order.status !== "paid") await (await import("./shop")).releasePromo(order.promoCode);
    }
    await updateOrder(rowId, { status: next, ...(next === "paid" && !order?.fulfilment ? { fulfilment: order?.delivery.mode === "event" ? ("ready_for_pickup" as const) : ("to_prepare" as const) } : {}) });
    if (status === "paid") await (await import("./invoice")).issueInvoice(txId);
    return { ok: true };
  }
  return { ok: false, error: "Transaction introuvable." };
}

export async function addManualPayment(data: { memberNumber?: string; name: string; email?: string; label: string; amountCents: number; method: PayMethod; status: TxStatus; note?: string }) {
  const row = await payments.insert({
    ...data,
    kind: "other",
    reference: `PAY-${randomUUID().slice(0, 8).toUpperCase()}`,
    paidAt: data.status === "paid" ? new Date().toISOString() : undefined,
  });
  if (data.status === "paid") await (await import("./invoice")).issueInvoice(`payment:${row.id}`);
  return row;
}

