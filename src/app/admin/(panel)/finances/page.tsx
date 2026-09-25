import Link from "next/link";
import { BarChart, Breakdown } from "@/components/admin/charts";
import { Kpi, Panel } from "@/components/admin/ui";
import { addDays, eur, monthKey } from "@/lib/admin/format";
import { requireAdmin } from "@/lib/server/admin-auth";
import { getTransactions } from "@/lib/server/business";

export const metadata = { title: "Recettes" };

export default async function FinancePage() {
  await requireAdmin("finance.view");
  const txs = await getTransactions();
  const paid = txs.filter((t) => t.status === "paid");
  const now = new Date();
  const sum = (from: Date) => paid.filter((t) => new Date(t.at) >= from).reduce((n, t) => n + t.amountCents, 0);
  const startDay = new Date(now.toISOString().slice(0, 10) + "T00:00:00Z");
  const day = (now.getUTCDay() + 6) % 7;
  const startWeek = addDays(startDay, -day);
  const startMonth = new Date(`${monthKey(now)}-01T00:00:00Z`);
  const startYear = new Date(`${now.getUTCFullYear()}-01-01T00:00:00Z`);

  // Douze derniers mois
  const months: string[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    months.push(monthKey(d));
  }
  const monthly = months.map((m) => paid.filter((t) => monthKey(t.at) === m).reduce((n, t) => n + t.amountCents, 0) / 100);
  const by = (type: string) => paid.filter((t) => t.type === type).reduce((n, t) => n + t.amountCents, 0);
  const pending = txs.filter((t) => t.status === "pending");
  const label = (m: string) => new Date(`${m}-01T00:00:00Z`).toLocaleDateString("fr-FR", { month: "short" }).replace(".", "");

  return (
    <>
      <header className="mb-7"><h1 className="font-display text-[clamp(26px,3vw,36px)] font-semibold uppercase leading-none tracking-[0.05em] text-white">Recettes</h1></header>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi label="Aujourd'hui" value={eur(sum(startDay))} />
        <Kpi label="Cette semaine" value={eur(sum(startWeek))} />
        <Kpi label="Ce mois" value={eur(sum(startMonth))} />
        <Kpi label="Cette année" value={eur(sum(startYear))} />
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <Panel title="Recettes par mois (€)"><BarChart labels={months.map(label)} values={monthly} format={(n) => `${n} €`} /></Panel>
        <Panel title="Répartition">
          <Breakdown format={eur} rows={[{ label: "Adhésions", value: by("Adhésion"), color: "#f01634" }, { label: "Événements", value: by("Événement"), color: "#5b8bff" }, { label: "Boutique", value: by("Boutique"), color: "#34d399" }, { label: "Autres", value: by("Autre"), color: "#a9b4c8" }]} />
        </Panel>
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <Kpi label="Paiements en attente" value={pending.length} tone={pending.length ? "orange" : undefined} href="/admin/finances/transactions?statut=pending" hint={eur(pending.reduce((n, t) => n + t.amountCents, 0))} />
        <Kpi label="Paiements échoués" value={txs.filter((t) => t.status === "failed").length} href="/admin/finances/transactions?statut=failed" />
        <Kpi label="Remboursements" value={txs.filter((t) => t.status === "refunded").length} href="/admin/finances/transactions?statut=refunded" hint={eur(txs.filter((t) => t.status === "refunded").reduce((n, t) => n + t.amountCents, 0))} />
      </div>
      <p className="mt-6 font-body text-[13px] text-mist"><Link href="/admin/finances/transactions" className="text-white underline underline-offset-4">Voir toutes les transactions</Link></p>
    </>
  );
}
