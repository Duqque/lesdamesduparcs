import "server-only";
import { addDays, dayKey, monthKey } from "@/lib/admin/format";
import { loadMemberRows } from "./admin-data";
import { getTransactions } from "./business";
import { articlesDb, pageViews } from "./content";
import { getAllEventsAdmin } from "./events";
import { listAllRegistrations, takenPlaces } from "./store";

export function lastMonths(n: number) {
  const now = new Date();
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (n - 1 - i), 1));
    return monthKey(d);
  });
}
export const monthLabel = (m: string) => new Date(`${m}-01T12:00:00Z`).toLocaleDateString("fr-FR", { month: "short" }).replace(".", "");

export async function membersAnalytics() {
  const rows = (await loadMemberRows()).filter((r) => r.status !== "anonymized");
  const months = lastMonths(12);
  const newPer = months.map((m) => rows.filter((r) => monthKey(r.joinedAt) === m).length);
  const cumulative = months.map((m) => rows.filter((r) => monthKey(r.joinedAt) <= m).length);
  const expiring = months.map((m) => rows.filter((r) => r.expiresAt && monthKey(r.expiresAt) === m).length);
  const byPlan = new Map<string, number>();
  const byCity = new Map<string, number>();
  const ages = { "Moins de 18 ans": 0, "18 à 25 ans": 0, "26 à 35 ans": 0, "36 à 50 ans": 0, "Plus de 50 ans": 0 };
  for (const r of rows) {
    byPlan.set(r.planName || "Sans formule", (byPlan.get(r.planName || "Sans formule") ?? 0) + 1);
    const city = r.member.address.city || "Non renseignée";
    byCity.set(city, (byCity.get(city) ?? 0) + 1);
    if (r.age < 18) ages["Moins de 18 ans"]++; else if (r.age <= 25) ages["18 à 25 ans"]++; else if (r.age <= 35) ages["26 à 35 ans"]++; else if (r.age <= 50) ages["36 à 50 ans"]++; else ages["Plus de 50 ans"]++;
  }
  const renewed = rows.filter((r) => r.isRenewal).length;
  const expiredEver = rows.filter((r) => r.status === "expired" || r.isRenewal).length;
  return {
    total: rows.length,
    active: rows.filter((r) => r.status === "active").length,
    months, newPer, cumulative, expiring,
    byPlan: [...byPlan.entries()].map(([label, value]) => ({ label, value })),
    byCity: [...byCity.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([label, value]) => ({ label, value })),
    ages: Object.entries(ages).map(([label, value]) => ({ label, value })),
    renewalRate: expiredEver ? (renewed / expiredEver) * 100 : 0,
  };
}

export async function financeAnalytics() {
  const txs = await getTransactions();
  const paid = txs.filter((t) => t.status === "paid");
  const months = lastMonths(12);
  const monthly = months.map((m) => paid.filter((t) => monthKey(t.at) === m).reduce((n, t) => n + t.amountCents, 0));
  const total = paid.reduce((n, t) => n + t.amountCents, 0);
  const members = new Set(paid.map((t) => t.memberNumber).filter(Boolean));
  const regs = paid.filter((t) => t.type === "Événement");
  const events = new Set(regs.map((t) => t.eventId));
  const by = (type: string) => paid.filter((t) => t.type === type).reduce((n, t) => n + t.amountCents, 0);
  return {
    months, monthly, total,
    average: paid.length ? total / paid.length : 0,
    perMember: members.size ? total / members.size : 0,
    perEvent: events.size ? regs.reduce((n, t) => n + t.amountCents, 0) / events.size : 0,
    byType: [{ label: "Adhésions", value: by("Adhésion") }, { label: "Événements", value: by("Événement") }, { label: "Boutique", value: by("Boutique") }, { label: "Autres", value: by("Autre") }],
    refunded: txs.filter((t) => t.status === "refunded").reduce((n, t) => n + t.amountCents, 0),
    pending: txs.filter((t) => t.status === "pending").reduce((n, t) => n + t.amountCents, 0),
  };
}

export async function eventsAnalytics() {
  const [events, regs, txs] = await Promise.all([getAllEventsAdmin(), listAllRegistrations(), getTransactions()]);
  return events.filter((e) => e.registration.mode === "form").map((e) => {
    const list = regs.filter((r) => r.eventId === e.id);
    const active = list.filter((r) => r.status !== "cancelled" && r.status !== "refunded" && r.status !== "waitlist");
    const cap = e.registration.capacity;
    return {
      id: e.id, title: e.title, date: e.date, capacity: cap,
      registered: takenPlaces(list),
      fill: cap ? (takenPlaces(list) / cap) * 100 : 0,
      cancelled: list.filter((r) => r.status === "cancelled" || r.status === "refunded").length,
      present: active.filter((r) => r.attended === true).length,
      absent: active.filter((r) => r.attended === false).length,
      revenue: txs.filter((t) => t.eventId === e.id && t.status === "paid").reduce((n, t) => n + t.amountCents, 0),
    };
  }).sort((a, b) => b.date.localeCompare(a.date));
}

export async function siteAnalytics(days = 30) {
  const [views, arts, events, rows, regs] = await Promise.all([pageViews.all(), articlesDb.all(), getAllEventsAdmin(), loadMemberRows(), listAllRegistrations()]);
  const since = addDays(new Date(), -(days - 1));
  const v = views.filter((x) => new Date(x.createdAt) >= since);
  const visitors = new Set(v.map((x) => x.sid || x.id));
  const sources = new Map<string, number>();
  for (const x of v) if (x.sid) sources.set(x.ref || "Accès direct", (sources.get(x.ref || "Accès direct") ?? 0) + 1);
  const pages = new Map<string, number>();
  for (const x of v) pages.set(x.path, (pages.get(x.path) ?? 0) + 1);
  const dayList = Array.from({ length: days }, (_, i) => dayKey(addDays(since, i)));
  const perDay = dayList.map((d) => v.filter((x) => x.createdAt.slice(0, 10) === d).length);
  const count = (prefix: string) => [...pages.entries()].filter(([p]) => p.startsWith(prefix) && p !== prefix.replace(/\/$/, "")).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const newMembers = rows.filter((r) => new Date(r.joinedAt) >= since).length;
  const newRegs = regs.filter((r) => new Date(r.createdAt) >= since).length;
  return {
    days, views: v.length, visitors: visitors.size, labels: dayList.map((d) => d.slice(8, 10) + "/" + d.slice(5, 7)), perDay,
    sources: [...sources.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([label, value]) => ({ label, value })),
    topPages: [...pages.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8),
    articles: count("/actualites/").map(([p, n]) => [arts.find((a) => `/actualites/${a.id}` === p)?.title ?? p, n] as [string, number]),
    events: count("/evenements/").map(([p, n]) => [events.find((e) => `/evenements/${e.id}` === p)?.title ?? p, n] as [string, number]),
    convMember: visitors.size ? (newMembers / visitors.size) * 100 : 0,
    convEvent: visitors.size ? (newRegs / visitors.size) * 100 : 0,
    newMembers, newRegs,
  };
}
