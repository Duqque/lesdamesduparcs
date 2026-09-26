import "server-only";
import { randomUUID } from "node:crypto";
import { adhesion as adhesionCopy } from "@/data/adhesion";
import type { MemberPublic } from "@/lib/members";
import { seasonOf } from "@/lib/season";
import type { RegistrationStatus } from "@/lib/registration";
import type { Order } from "@/lib/orders";
import { collection, type Row } from "./db";
import { listAllRegistrations, listOrders, listStoredMembers, updateOrder, updateRegistration } from "./store";
import { releaseStock } from "./shop";
import { paymentConfigured, refundCheckout } from "./helloasso";
import { getAllEventsAdmin } from "./events";

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
  await payments.insert({
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

const orderStatusToTx = (s: Order["status"]): TxStatus => (s === "paid" ? "paid" : s === "awaiting_payment" ? "pending" : s);

export async function getTransactions(): Promise<Tx[]> {
  const [pays, regs, orders, evs] = await Promise.all([payments.all(), listAllRegistrations(), listOrders(), getAllEventsAdmin()]);
  const title = (id: string) => evs.find((e) => e.id === id)?.title ?? id;
  const out: Tx[] = [];
  for (const p of pays)
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
    await payments.update(rowId, { status, method: opts?.method, note: opts?.note, paidAt: status === "paid" ? new Date().toISOString() : undefined });
    return { ok: true };
  }
  if (source === "registration") {
    const reg = (await listAllRegistrations()).find((r) => r.id === rowId);
    const err = reg?.status === "paid" ? await refund(reg.checkoutId) : null;
    if (err) return { ok: false, error: `Remboursement HelloAsso impossible : ${err}. Effectuez-le depuis votre espace HelloAsso, puis marquez la transaction comme remboursée.` };
    const map: Record<TxStatus, RegistrationStatus> = { paid: "paid", pending: "awaiting_payment", failed: "awaiting_payment", refunded: "refunded", cancelled: "cancelled" };
    await updateRegistration(rowId, { status: map[status] });
    return { ok: true };
  }
  if (source === "order") {
    const order = (await listOrders()).find((o) => o.id === rowId);
    const err = order?.status === "paid" ? await refund(order.checkoutId) : null;
    if (err) return { ok: false, error: `Remboursement HelloAsso impossible : ${err}. Effectuez-le depuis votre espace HelloAsso, puis marquez la transaction comme remboursée.` };
    const map: Record<TxStatus, Order["status"]> = { paid: "paid", pending: "awaiting_payment", failed: "awaiting_payment", refunded: "refunded", cancelled: "cancelled" };
    const next = map[status];
    const wasOut = order?.status === "cancelled" || order?.status === "refunded";
    const goingOut = next === "cancelled" || next === "refunded";
    if (order && goingOut && !wasOut) await releaseStock(order.lines);
    await updateOrder(rowId, { status: next, ...(next === "paid" && !order?.fulfilment ? { fulfilment: order?.delivery.mode === "event" ? ("ready_for_pickup" as const) : ("to_prepare" as const) } : {}) });
    return { ok: true };
  }
  return { ok: false, error: "Transaction introuvable." };
}

export async function addManualPayment(data: { memberNumber?: string; name: string; email?: string; label: string; amountCents: number; method: PayMethod; status: TxStatus; note?: string }) {
  return payments.insert({
    ...data,
    kind: "other",
    reference: `PAY-${randomUUID().slice(0, 8).toUpperCase()}`,
    paidAt: data.status === "paid" ? new Date().toISOString() : undefined,
  });
}

