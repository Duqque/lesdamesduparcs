import { BarChart, Breakdown } from "@/components/admin/charts";
import { Kpi, PageHeader, Panel } from "@/components/admin/ui";
import { eur } from "@/lib/admin/format";
import { requireAdmin } from "@/lib/server/admin-auth";
import { financeAnalytics, monthLabel } from "@/lib/server/analytics";

export const metadata = { title: "Analytics · Finances" };

export default async function FinanceAnalyticsPage() {
  await requireAdmin("finance.view");
  await requireAdmin("analytics.view");
  const d = await financeAnalytics();
  return (
    <>
      <PageHeader title="Finances" subtitle="Recettes, revenu moyen et répartition." />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi label="Recettes totales" value={eur(d.total)} />
        <Kpi label="Revenu moyen" value={eur(Math.round(d.average))} hint="par transaction" />
        <Kpi label="Revenu par membre" value={eur(Math.round(d.perMember))} />
        <Kpi label="Revenu par événement" value={eur(Math.round(d.perEvent))} />
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <Panel title="Recettes par mois (€)"><BarChart labels={d.months.map(monthLabel)} values={d.monthly.map((c) => c / 100)} format={(n) => `${n} €`} /></Panel>
        <Panel title="Répartition"><Breakdown rows={d.byType} format={eur} /></Panel>
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Kpi label="Remboursé" value={eur(d.refunded)} />
        <Kpi label="En attente d'encaissement" value={eur(d.pending)} tone="orange" />
      </div>
    </>
  );
}
