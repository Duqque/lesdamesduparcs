import { BarChart, Breakdown } from "@/components/admin/charts";
import { Kpi, PageHeader, Panel } from "@/components/admin/ui";
import { eur, num } from "@/lib/admin/format";
import { requireAdmin } from "@/lib/server/admin-auth";
import { lastMonths, monthLabel, shopAnalytics } from "@/lib/server/analytics";

export const metadata = { title: "Analytics · Boutique" };

export default async function ShopAnalyticsPage() {
  const ctx = await requireAdmin("analytics.view");
  await requireAdmin("shop.view");
  const d = await shopAnalytics();
  const fin = ctx.can("finance.view") || ctx.can("shop.pricing");
  return (
    <>
      <PageHeader title="Boutique" subtitle="Ventes des commandes payées : produits les plus vendus, évolution et modes de livraison." />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi label="Commandes payées" value={num(d.orders)} />
        {fin && <Kpi label="Chiffre d'affaires" value={eur(d.revenue)} />}
        {fin && <Kpi label="Panier moyen" value={eur(Math.round(d.average))} />}
        {fin && <Kpi label="Réductions accordées" value={eur(d.discounts)} />}
      </div>
      {fin && <Panel className="mt-4" title="Ventes par mois (€)"><BarChart labels={lastMonths(12).map(monthLabel)} values={d.monthly.map((c) => c / 100)} format={(n) => `${n} €`} /></Panel>}
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Panel title="Produits les plus vendus"><Breakdown rows={d.top.length ? d.top.map((t) => ({ label: `${t.name} (${t.qty})`, value: fin ? t.revenue : t.qty })) : [{ label: "Aucune vente", value: 0 }]} format={fin ? eur : String} /></Panel>
        <Panel title="Modes de livraison"><Breakdown rows={d.delivery} /></Panel>
      </div>
    </>
  );
}
