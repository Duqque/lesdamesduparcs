import { privacyRequests } from "./privacy";
import { contactMessages } from "./content";
import "server-only";
import { ageAt } from "@/lib/registration";
import { addDays, dayKey, monthKey } from "@/lib/admin/format";
import type { MemberPublic } from "@/lib/members";
import type { AdminContext } from "./admin-auth";
import { admins, loginEvents, resetRequests } from "./admin-store";
import { effectiveStatus, getTransactions, memberships, payments, syncMemberships, type Membership, type Payment, type Tx, type TxStatus } from "./business";
import { articlesDb } from "./content";
import { getAllEventsAdmin } from "./events";
import { listAllRegistrations, listOrders, listStoredMembers } from "./store";
import { productsDb, shopConfig, totalStock } from "./shop";

/* ---------- Adhérentes : vue jointe membre + adhésion + paiement ---------- */

export type MemberStatus = "active" | "expired" | "suspended" | "anonymized";

export interface MemberRow {
  member: MemberPublic;
  membership: Membership | null;
  status: MemberStatus;
  payment: TxStatus | null;
  planName: string;
  expiresAt: string | null;
  joinedAt: string;
  isRenewal: boolean;
  age: number;
}

export async function loadMemberRows(): Promise<MemberRow[]> {
  await syncMemberships();
  const [members, ms, pays] = await Promise.all([listStoredMembers(), memberships.all(), payments.all()]);
  const byMember = new Map<string, Membership[]>();
  for (const m of ms) byMember.set(m.memberId, [...(byMember.get(m.memberId) ?? []), m]);
  const payByMs = new Map<string, Payment>();
  for (const p of pays) if (p.membershipId) payByMs.set(p.membershipId, p);
  const today = new Date().toISOString().slice(0, 10);
  return members.map(({ passwordHash: _p, ...member }) => {
    void _p;
    const list = (byMember.get(member.id) ?? []).sort((a, b) => b.startsAt.localeCompare(a.startsAt));
    const current = list[0] ?? null;
    let status: MemberStatus = "active";
    if (member.status === "anonymized") status = "anonymized";
    else if (member.status === "suspended" || current?.status === "suspended") status = "suspended";
    else if (!current || effectiveStatus(current) !== "active") status = "expired";
    return {
      member,
      membership: current,
      status,
      payment: current ? (payByMs.get(current.id)?.status ?? null) : null,
      planName: current?.planName ?? "",
      expiresAt: current?.endsAt ?? member.validUntil,
      joinedAt: member.joinedAt,
      isRenewal: list.length > 1,
      age: ageAt(member.birthDate, today),
    };
  });
}

export interface MemberFilters {
  q?: string;
  vue?: string;
  plan?: string;
  statut?: string;
  paiement?: string;
  ville?: string;
  age?: string;
  du?: string;
  au?: string;
  expDu?: string;
  expAu?: string;
  mineure?: string;
  tri?: string;
}

export function filterMembers(rows: MemberRow[], f: MemberFilters): MemberRow[] {
  const q = f.q?.trim().toLowerCase();
  const now = new Date();
  const in30 = addDays(now, 30);
  let out = rows.filter((r) => {
    const m = r.member;
    if (q && ![m.firstName, m.lastName, `${m.firstName} ${m.lastName}`, m.email, m.phone, m.memberNumber, m.address.city].some((v) => v?.toLowerCase().includes(q))) return false;
    if (f.plan && r.membership?.planId !== f.plan) return false;
    if (f.statut && r.status !== f.statut) return false;
    if (f.paiement && (r.payment ?? "none") !== f.paiement) return false;
    if (f.ville && !m.address.city.toLowerCase().includes(f.ville.toLowerCase())) return false;
    if (f.age) {
      const [a, b] = f.age === "50+" ? [50, 200] : f.age === "<18" ? [0, 17] : f.age.split("-").map(Number);
      if (r.age < a || r.age > b) return false;
    }
    if (f.du && r.joinedAt.slice(0, 10) < f.du) return false;
    if (f.au && r.joinedAt.slice(0, 10) > f.au) return false;
    if (f.expDu && (r.expiresAt ?? "").slice(0, 10) < f.expDu) return false;
    if (f.expAu && (r.expiresAt ?? "").slice(0, 10) > f.expAu) return false;
    if (f.mineure === "1" && r.age >= 18) return false;
    switch (f.vue) {
      case "nouvelles": return new Date(r.joinedAt) >= addDays(now, -30) && !r.isRenewal;
      case "renouvellements": return r.status === "active" && r.expiresAt !== null && new Date(r.expiresAt) <= addDays(now, 60) ? true : r.isRenewal;
      case "expirees": return r.status === "expired";
      case "retard": return r.payment === "pending";
    }
    return true;
  });
  const key = f.tri ?? "-joined";
  const dir = key.startsWith("-") ? -1 : 1;
  const k = key.replace(/^-/, "");
  const val = (r: MemberRow): string | number => (k === "nom" ? `${r.member.lastName} ${r.member.firstName}`.toLowerCase() : k === "exp" ? r.expiresAt ?? "" : k === "statut" ? r.status : r.joinedAt);
  out = out.sort((a, b) => (val(a) < val(b) ? -1 : val(a) > val(b) ? 1 : 0) * dir);
  void in30;
  return out;
}

/* ---------- Tableau de bord ---------- */

export interface Alert {
  level: "urgent" | "important" | "info";
  text: string;
  href: string;
}

const pctChange = (now: number, before: number) => (before === 0 ? (now > 0 ? 100 : 0) : ((now - before) / before) * 100);

export async function dashboardData(range: { start: Date; end: Date; days: number }) {
  const [rows, txs, events, regs] = await Promise.all([loadMemberRows(), getTransactions(), getAllEventsAdmin(), listAllRegistrations()]);
  const now = new Date();
  const today = dayKey(now);
  const inRange = (iso: string) => new Date(iso) >= range.start && new Date(iso) <= range.end;
  const prevStart = addDays(range.start, -range.days);
  const inPrev = (iso: string) => new Date(iso) >= prevStart && new Date(iso) < range.start;

  const active = rows.filter((r) => r.status === "active");
  const newInRange = rows.filter((r) => inRange(r.joinedAt));
  const newPrev = rows.filter((r) => inPrev(r.joinedAt));
  const activeBefore = rows.filter((r) => r.status !== "anonymized" && new Date(r.joinedAt) < range.start).length;

  const paid = txs.filter((t) => t.status === "paid");
  const revenueRange = paid.filter((t) => inRange(t.at)).reduce((n, t) => n + t.amountCents, 0);
  const revenuePrev = paid.filter((t) => inPrev(t.at)).reduce((n, t) => n + t.amountCents, 0);
  const count = (s: TxStatus) => txs.filter((t) => t.status === s).length;

  const expiring30 = active.filter((r) => r.expiresAt && new Date(r.expiresAt) <= addDays(now, 30)).length;
  const upcoming = events.filter((e) => (e.status ?? "published") === "published" && e.date >= today);
  const activeRegs = regs.filter((r) => r.status !== "cancelled" && r.status !== "refunded" && r.status !== "waitlist");
  const placesReserved = upcoming.reduce((n, e) => n + activeRegs.filter((r) => r.eventId === e.id).reduce((m, r) => m + r.places, 0), 0);
  const placesTotal = upcoming.reduce((n, e) => n + e.registration.capacity, 0);

  // Séries
  const dayList: string[] = [];
  for (let i = 0; i < range.days; i++) dayList.push(dayKey(addDays(range.start, i)));
  const adhSeries = dayList.map((d) => rows.filter((r) => r.joinedAt.slice(0, 10) === d).length);
  const revSeries = dayList.map((d) => paid.filter((t) => t.at.slice(0, 10) === d).reduce((n, t) => n + t.amountCents, 0) / 100);
  const cumulative = adhSeries.reduce<number[]>((acc, v, i) => [...acc, (acc[i - 1] ?? activeBefore) + v], []);

  const alerts: Alert[] = [];
  const pending = count("pending");
  if (pending) alerts.push({ level: "urgent", text: `${pending} paiement${pending > 1 ? "s" : ""} en attente`, href: "/admin/finances/transactions?statut=pending" });
  const failed = count("failed");
  if (failed) alerts.push({ level: "urgent", text: `${failed} paiement${failed > 1 ? "s" : ""} échoué${failed > 1 ? "s" : ""}`, href: "/admin/finances/transactions?statut=failed" });
  if (expiring30) alerts.push({ level: "important", text: `${expiring30} adhésion${expiring30 > 1 ? "s" : ""} arrive${expiring30 > 1 ? "nt" : ""} à expiration (30 jours)`, href: "/admin/adherentes?vue=renouvellements" });
  for (const e of upcoming) {
    const taken = activeRegs.filter((r) => r.eventId === e.id).reduce((n, r) => n + r.places, 0);
    const cap = e.registration.capacity;
    if (e.registration.mode === "form" && cap > 0 && taken / cap >= 0.9) alerts.push({ level: "important", text: `${e.title} ${taken >= cap ? "est complet" : "est presque complet"} (${taken}/${cap})`, href: `/admin/evenements/${e.id}` });
    const wait = regs.filter((r) => r.eventId === e.id && r.status === "waitlist").length;
    if (wait) alerts.push({ level: "important", text: `${wait} personne${wait > 1 ? "s" : ""} en liste d'attente : ${e.title}`, href: `/admin/evenements/${e.id}?vue=attente` });
  }
  const [orders, prods, shopCfg] = await Promise.all([listOrders(), productsDb.all(), shopConfig.get()]);
  const toPrepare = orders.filter((o) => o.status === "paid" && (!o.fulfilment || o.fulfilment === "to_prepare")).length;
  if (toPrepare) alerts.push({ level: "important", text: `${toPrepare} commande${toPrepare > 1 ? "s" : ""} boutique à préparer`, href: "/admin/boutique/commandes?suivi=to_prepare" });
  const out = prods.filter((p) => p.status === "active" && p.trackStock && totalStock(p) <= 0).length;
  const low = prods.filter((p) => p.status === "active" && p.trackStock && totalStock(p) > 0 && totalStock(p) <= shopCfg.lowStock).length;
  if (out) alerts.push({ level: "urgent", text: `${out} produit${out > 1 ? "s" : ""} en rupture de stock`, href: "/admin/boutique?stock=rupture" });
  if (low) alerts.push({ level: "important", text: `${low} produit${low > 1 ? "s" : ""} en stock bas`, href: "/admin/boutique?stock=bas" });
  const newToday = rows.filter((r) => r.joinedAt.slice(0, 10) === today).length;
  if (newToday) alerts.push({ level: "info", text: `${newToday} nouvelle${newToday > 1 ? "s" : ""} adhésion${newToday > 1 ? "s" : ""} aujourd'hui`, href: "/admin/adherentes?vue=nouvelles" });

  return {
    active: active.length,
    activeDelta: pctChange(active.length, activeBefore),
    newInRange: newInRange.length,
    newDelta: pctChange(newInRange.length, newPrev.length),
    renewals: rows.filter((r) => r.isRenewal && inRange(r.membership?.startsAt ?? "")).length,
    expired: rows.filter((r) => r.status === "expired").length,
    expiring30,
    registrations: activeRegs.length,
    revenueRange,
    revenueDelta: pctChange(revenueRange, revenuePrev),
    pay: { paid: count("paid"), pending, failed, refunded: count("refunded") },
    upcoming: upcoming.length,
    placesReserved,
    placesLeft: Math.max(placesTotal - placesReserved, 0),
    labels: dayList.map((d) => d.slice(8, 10) + "/" + d.slice(5, 7)),
    adhSeries,
    cumulative,
    revSeries,
    alerts,
    totalMembers: rows.filter((r) => r.status !== "anonymized").length,
  };
}

export interface Activity {
  at: string;
  text: string;
  amount?: number;
  href?: string;
}

export async function recentActivity(limit = 12): Promise<Activity[]> {
  const [rows, txs, arts, events, regs] = await Promise.all([loadMemberRows(), getTransactions(), articlesDb.all(), getAllEventsAdmin(), listAllRegistrations()]);
  const out: Activity[] = [];
  for (const r of rows) out.push({ at: r.joinedAt, text: `${r.member.firstName} ${r.member.lastName} a ${r.isRenewal ? "renouvelé son adhésion" : "adhéré"}`, href: `/admin/adherentes/${r.member.id}` });
  for (const t of txs) if (t.status === "paid" && t.type !== "Adhésion") out.push({ at: t.at, text: `Paiement reçu de ${t.name} (${t.type.toLowerCase()})`, amount: t.amountCents, href: "/admin/finances/transactions" });
  for (const g of regs) {
    const ev = events.find((e) => e.id === g.eventId);
    out.push({ at: g.createdAt, text: `${g.firstName} ${g.lastName} s'est inscrite à ${ev?.title ?? g.eventId}`, href: ev ? `/admin/evenements/${ev.id}` : undefined });
  }
  for (const a of arts) if (a.status === "published" && a.origin !== "seed") out.push({ at: a.publishAt ?? a.createdAt, text: `Article publié : ${a.title}`, href: `/admin/contenu/${a.id}` });
  for (const e of events) if (e.origin !== "seed") out.push({ at: e.createdAt, text: `Événement « ${e.title} » créé`, href: `/admin/evenements/${e.id}` });
  return out.sort((a, b) => b.at.localeCompare(a.at)).slice(0, limit);
}

/** Notifications de la cloche : classées urgente, importante, information. */
export async function adminNotifications(ctx: AdminContext): Promise<Alert[]> {
  const list: Alert[] = [];
  if (ctx.can("dashboard.view")) {
    const d = await dashboardData({ start: addDays(new Date(), -29), end: new Date(), days: 30 });
    list.push(...d.alerts.filter((a) => (ctx.can("finance.view") || !a.href.includes("finances")) && (ctx.can("shop.view") || !a.href.includes("boutique")) && (ctx.can("members.view") || !a.href.includes("adherentes"))));
  }
  if (ctx.can("admins.manage")) {
    const [reqs, logins] = await Promise.all([resetRequests.find((r) => r.status === "open"), loginEvents.find((e) => Date.now() - new Date(e.createdAt).getTime() < 86_400_000)]);
    if (reqs.length) list.push({ level: "urgent", text: `${reqs.length} demande${reqs.length > 1 ? "s" : ""} de réinitialisation de mot de passe`, href: "/admin/configuration/administratrices" });
    const unusual = logins.filter((e) => e.success && e.reason === "nouvelle adresse").length;
    if (unusual) list.push({ level: "important", text: `${unusual} connexion${unusual > 1 ? "s" : ""} depuis une nouvelle adresse (24 h)`, href: "/admin/configuration/journal" });
    const fails = logins.filter((e) => !e.success).length;
    if (fails >= 3) list.push({ level: "important", text: `${fails} tentatives de connexion échouées (24 h)`, href: "/admin/configuration/journal" });
  }
  if (ctx.can("communication.send")) {
    const fresh = await contactMessages.find((m) => m.status === "new");
    if (fresh.length) list.push({ level: "important", text: `${fresh.length} nouveau${fresh.length > 1 ? "x" : ""} message${fresh.length > 1 ? "s" : ""} de contact`, href: "/admin/communication/messages" });
  }
  if (ctx.can("privacy.manage")) {
    const open = await privacyRequests.find((r) => r.status === "received" || r.status === "in_progress");
    const late = open.filter((r) => new Date(r.dueAt).getTime() < Date.now()).length;
    if (late) list.push({ level: "urgent", text: `${late} demande${late > 1 ? "s" : ""} RGPD hors délai (1 mois)`, href: "/admin/rgpd" });
    else if (open.length) list.push({ level: "important", text: `${open.length} demande${open.length > 1 ? "s" : ""} RGPD à traiter`, href: "/admin/rgpd" });
  }
  const order = { urgent: 0, important: 1, info: 2 } as const;
  return list.sort((a, b) => order[a.level] - order[b.level]);
}

export type { Tx };
export { monthKey, admins };

/* ---------- Calendrier global ---------- */

export interface CalItem {
  date: string;
  kind: "event" | "post" | "campaign" | "expiry" | "match";
  label: string;
  href?: string;
}

export async function calendarItems(): Promise<CalItem[]> {
  const { campaigns } = await import("./content");
  const [events, arts, camps, rows] = await Promise.all([getAllEventsAdmin(), articlesDb.all(), campaigns.all(), loadMemberRows()]);
  const items: CalItem[] = [];
  for (const e of events) if (e.status !== "archived") items.push({ date: e.date, kind: "event", label: `${e.time} · ${e.title}`, href: `/admin/evenements/${e.id}` });
  const { psgMatches: matchesDb } = await import("./matches");
  for (const m of await matchesDb.find((x) => !x.hidden)) items.push({ date: m.date, kind: "match", label: `${m.time || "—"} · Match PSG : ${m.homeTeam === "Paris Saint-Germain" ? "PSG – " + m.awayTeam : m.homeTeam + " – PSG"}`, href: "/admin/evenements/matchs" });
  for (const a of arts) if (a.status !== "archived") items.push({ date: (a.publishAt ?? a.date).slice(0, 10), kind: "post", label: `${a.status === "draft" ? "Brouillon" : a.status === "scheduled" ? "Programmé" : "Publié"} · ${a.title}`, href: `/admin/contenu/${a.id}` });
  for (const c of camps) {
    const d = c.scheduledAt ?? c.sentAt ?? c.createdAt;
    items.push({ date: d.slice(0, 10), kind: "campaign", label: `${c.status === "sent" ? "Envoyée" : "Campagne"} · ${c.subject}`, href: `/admin/communication/${c.id}` });
  }
  const byDay = new Map<string, number>();
  for (const r of rows) if (r.status === "active" && r.expiresAt) byDay.set(r.expiresAt.slice(0, 10), (byDay.get(r.expiresAt.slice(0, 10)) ?? 0) + 1);
  for (const [d, n] of byDay) items.push({ date: d, kind: "expiry", label: `${n} adhésion${n > 1 ? "s" : ""} arrive${n > 1 ? "nt" : ""} à échéance`, href: "/admin/adherentes?vue=renouvellements" });
  return items.sort((a, b) => a.date.localeCompare(b.date));
}
