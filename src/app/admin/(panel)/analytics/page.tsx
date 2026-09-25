import { BarChart, Breakdown, LineChart } from "@/components/admin/charts";
import { Kpi, PageHeader, Panel } from "@/components/admin/ui";
import { num, pct } from "@/lib/admin/format";
import { requireAdmin } from "@/lib/server/admin-auth";
import { lastMonths, membersAnalytics, monthLabel } from "@/lib/server/analytics";

export const metadata = { title: "Analytics · Membres" };

export default async function MembersAnalyticsPage() {
  await requireAdmin("analytics.view");
  const d = await membersAnalytics();
  const labels = lastMonths(12).map(monthLabel);
  return (
    <>
      <PageHeader title="Membres" subtitle="Évolution, acquisition, renouvellement et répartition." />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi label="Adhérentes" value={num(d.total)} />
        <Kpi label="Actives" value={num(d.active)} />
        <Kpi label="Taux de renouvellement" value={pct(d.renewalRate).replace("+", "")} />
        <Kpi label="Échéances à venir (12 mois)" value={num(d.expiring.reduce((a, b) => a + b, 0))} />
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Panel title="Évolution du nombre d'adhérentes"><LineChart labels={labels} series={[{ label: "Adhérentes", color: "#f01634", values: d.cumulative }]} /></Panel>
        <Panel title="Acquisition (nouvelles adhésions par mois)"><BarChart labels={labels} values={d.newPer} /></Panel>
        <Panel title="Expirations par mois"><BarChart labels={labels} values={d.expiring} color="#fbbf24" /></Panel>
        <Panel title="Répartition par formule"><Breakdown rows={d.byPlan} /></Panel>
        <Panel title="Répartition par âge"><Breakdown rows={d.ages} /></Panel>
        <Panel title="Villes principales"><Breakdown rows={d.byCity} /></Panel>
      </div>
    </>
  );
}
