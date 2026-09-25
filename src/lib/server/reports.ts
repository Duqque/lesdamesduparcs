import "server-only";
import { eur, fmtDate, monthKey, num } from "@/lib/admin/format";
import { loadMemberRows } from "./admin-data";
import { getTransactions } from "./business";
import { campaigns, emailLog } from "./content";
import { listAllRegistrations } from "./store";
import { getAllEventsAdmin } from "./events";

export interface ReportSection {
  title: string;
  rows: Array<[string, string]>;
}

export const REPORT_SECTIONS = [
  ["membres", "Membres"],
  ["adhesions", "Adhésions"],
  ["evenements", "Événements"],
  ["finances", "Finances"],
  ["communication", "Communication"],
] as const;

/** Récapitulatif d'un mois (AAAA-MM) pour les sections choisies. Les sections financières exigent la permission correspondante côté appelant. */
export async function buildReport(month: string, sections: string[], allowFinance: boolean): Promise<{ title: string; sections: ReportSection[] }> {
  const label = new Date(`${month}-01T12:00:00Z`).toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
  const [rows, txs, events, regs, camps, mails] = await Promise.all([loadMemberRows(), getTransactions(), getAllEventsAdmin(), listAllRegistrations(), campaigns.all(), emailLog.all()]);
  const inMonth = (iso?: string) => !!iso && monthKey(iso) === month;
  const out: ReportSection[] = [];
  if (sections.includes("membres")) {
    const active = rows.filter((r) => r.status === "active").length;
    out.push({ title: "Membres", rows: [["Adhérentes au total", num(rows.filter((r) => r.status !== "anonymized").length)], ["Adhérentes actives", num(active)], ["Adhérentes suspendues", num(rows.filter((r) => r.status === "suspended").length)], ["Mineures", num(rows.filter((r) => r.age < 18).length)]] });
  }
  if (sections.includes("adhesions")) {
    const news = rows.filter((r) => inMonth(r.joinedAt));
    out.push({ title: "Adhésions", rows: [["Nouvelles adhésions du mois", num(news.filter((r) => !r.isRenewal).length)], ["Renouvellements du mois", num(rows.filter((r) => r.isRenewal && inMonth(r.membership?.startsAt)).length)], ["Adhésions arrivant à échéance dans le mois", num(rows.filter((r) => r.status === "active" && inMonth(r.expiresAt ?? undefined)).length)], ["Adhésions expirées (total)", num(rows.filter((r) => r.status === "expired").length)]] });
  }
  if (sections.includes("evenements")) {
    const list = events.filter((e) => e.date.startsWith(month));
    out.push({ title: "Événements", rows: [["Événements du mois", num(list.length)], ...list.map((e): [string, string] => { const r = regs.filter((x) => x.eventId === e.id && x.status !== "cancelled" && x.status !== "refunded" && x.status !== "waitlist"); return [`${fmtDate(e.date)} · ${e.title}`, `${r.reduce((n, x) => n + x.places, 0)} inscrite(s)${e.registration.capacity ? ` / ${e.registration.capacity}` : ""}`]; }), ["Inscriptions reçues dans le mois", num(regs.filter((r) => inMonth(r.createdAt)).length)]] });
  }
  if (sections.includes("finances") && allowFinance) {
    const m = txs.filter((t) => inMonth(t.at));
    const paid = m.filter((t) => t.status === "paid");
    out.push({ title: "Finances", rows: [["Recettes encaissées", eur(paid.reduce((n, t) => n + t.amountCents, 0))], ["Adhésions", eur(paid.filter((t) => t.type === "Adhésion").reduce((n, t) => n + t.amountCents, 0))], ["Événements", eur(paid.filter((t) => t.type === "Événement").reduce((n, t) => n + t.amountCents, 0))], ["Boutique", eur(paid.filter((t) => t.type === "Boutique").reduce((n, t) => n + t.amountCents, 0))], ["Paiements en attente", `${m.filter((t) => t.status === "pending").length} (${eur(m.filter((t) => t.status === "pending").reduce((n, t) => n + t.amountCents, 0))})`], ["Remboursements", `${m.filter((t) => t.status === "refunded").length} (${eur(m.filter((t) => t.status === "refunded").reduce((n, t) => n + t.amountCents, 0))})`]] });
  }
  if (sections.includes("communication")) {
    out.push({ title: "Communication", rows: [["Campagnes envoyées", num(camps.filter((c) => c.status === "sent" && inMonth(c.sentAt)).length)], ["Campagnes programmées", num(camps.filter((c) => c.status === "scheduled").length)], ["E-mails automatiques envoyés", num(mails.filter((e) => e.status === "sent" && inMonth(e.createdAt)).length)]] });
  }
  return { title: `Rapport de ${label}`, sections: out };
}
