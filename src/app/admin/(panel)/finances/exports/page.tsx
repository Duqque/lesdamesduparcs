import { Download } from "lucide-react";
import { PageHeader, Panel, btn, inp, lbl } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/server/admin-auth";

export const metadata = { title: "Exports financiers" };

export default async function FinanceExportsPage() {
  await requireAdmin("finance.export");
  return (
    <>
      <PageHeader title="Exports" subtitle="Choisissez une période et un statut : le fichier ne contient que les transactions correspondantes." />
      <Panel title="Exporter les transactions">
        <form action="/admin/export/transactions" method="get" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label><span className={lbl}>Du</span><input type="date" name="du" className={inp + " mt-1.5"} /></label>
          <label><span className={lbl}>Au</span><input type="date" name="au" className={inp + " mt-1.5"} /></label>
          <label><span className={lbl}>Statut</span><select name="statut" className={inp + " mt-1.5"}><option value="">Tous</option><option value="paid">Payé</option><option value="pending">En attente</option><option value="failed">Échoué</option><option value="refunded">Remboursé</option><option value="cancelled">Annulé</option></select></label>
          <label><span className={lbl}>Type</span><select name="type" className={inp + " mt-1.5"}><option value="">Tous</option><option>Adhésion</option><option>Événement</option><option>Boutique</option><option>Autre</option></select></label>
          <label><span className={lbl}>Format</span><select name="format" className={inp + " mt-1.5"}><option value="csv">CSV / Excel</option><option value="pdf">PDF</option></select></label>
          <div className="flex items-end"><button type="submit" className={btn.primary}><Download aria-hidden className="size-4" /> Exporter</button></div>
        </form>
        <p className="mt-4 font-body text-[12.5px] text-mist">« Excel » : fichier CSV (séparateur point-virgule) qui s&rsquo;ouvre directement dans Excel.</p>
      </Panel>
    </>
  );
}
