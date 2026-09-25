import { Breakdown, LineChart } from "@/components/admin/charts";
import { Kpi, PageHeader, Panel } from "@/components/admin/ui";
import { num, pct } from "@/lib/admin/format";
import { requireAdmin } from "@/lib/server/admin-auth";
import { siteAnalytics } from "@/lib/server/analytics";

export const metadata = { title: "Analytics · Site" };

export default async function SiteAnalyticsPage() {
  await requireAdmin("analytics.view");
  const d = await siteAnalytics(30);
  const list = (rows: Array<[string, number]>) => rows.length === 0 ? <p className="font-body text-[13.5px] text-mist">Pas encore de données.</p> : <Breakdown rows={rows.map(([label, value]) => ({ label, value }))} />;
  return (
    <>
      <PageHeader title="Site" subtitle="Mesure d'audience interne, sans cookie ni adresse IP, sur les 30 derniers jours. Elle démarre dès la mise en ligne de cette version." />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi label="Visiteurs" value={num(d.visitors)} />
        <Kpi label="Pages vues" value={num(d.views)} />
        <Kpi label="Visite → adhésion" value={pct(d.convMember).replace("+", "")} hint={`${d.newMembers} adhésion(s)`} />
        <Kpi label="Visite → inscription événement" value={pct(d.convEvent).replace("+", "")} hint={`${d.newRegs} inscription(s)`} />
      </div>
      <Panel className="mt-4" title="Pages vues par jour"><LineChart labels={d.labels} series={[{ label: "Pages vues", color: "#5b8bff", values: d.perDay }]} /></Panel>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Panel title="Sources de trafic"><Breakdown rows={d.sources.length ? d.sources : [{ label: "Accès direct", value: 0 }]} /></Panel>
        <Panel title="Pages les plus vues">{list(d.topPages)}</Panel>
        <Panel title="Articles consultés">{list(d.articles)}</Panel>
        <Panel title="Événements consultés">{list(d.events)}</Panel>
      </div>
    </>
  );
}
