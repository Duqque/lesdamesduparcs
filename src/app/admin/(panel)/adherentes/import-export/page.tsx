/* eslint-disable @next/next/no-html-link-for-pages -- téléchargements de fichiers (routes d'export), pas des pages */
import { Download } from "lucide-react";
import { SubmitButton } from "@/components/admin/SubmitButton";
import { Flash, PageHeader, Panel, btn } from "@/components/admin/ui";
import { first, type SP } from "@/lib/admin/params";
import { requireAdmin } from "@/lib/server/admin-auth";
import { importMembersAction } from "../actions";

export const metadata = { title: "Import / export" };

export default async function ImportExportPage({ searchParams }: { searchParams: Promise<SP> }) {
  const ctx = await requireAdmin("members.export");
  const sp = await searchParams;
  return (
    <>
      <PageHeader title="Import / export" subtitle="Les exports respectent les filtres de la liste des adhérentes : filtrez d'abord, exportez ensuite." />
      <Flash ok={first(sp.ok)} error={first(sp.erreur)} />
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Exporter toutes les adhérentes">
          <p className="font-body text-[13.5px] text-mist">« Excel » est un fichier CSV (séparateur point-virgule, accents conservés) qui s&rsquo;ouvre directement dans Excel.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <a href="/admin/export/adherentes?format=csv" className={btn.outline}><Download aria-hidden className="size-4" /> CSV</a>
            <a href="/admin/export/adherentes?format=csv" className={btn.outline}><Download aria-hidden className="size-4" /> Excel</a>
            <a href="/admin/export/adherentes?format=pdf" className={btn.outline}><Download aria-hidden className="size-4" /> PDF</a>
          </div>
          <p className="mt-4 font-body text-[12.5px] text-mist">Pour exporter une sélection (par exemple « adhérentes actives inscrites entre janvier et septembre »), appliquez les filtres dans <a href="/admin/adherentes" className="text-white underline underline-offset-4">Toutes les adhérentes</a>, puis cliquez sur « Exporter ».</p>
        </Panel>
        {ctx.can("members.edit") && (
          <Panel title="Importer un fichier CSV">
            <p className="font-body text-[13.5px] text-mist">Colonnes attendues : <span className="text-white/85">prenom, nom, email, telephone, naissance, adresse, codepostal, ville, pays, formule</span>. La date de naissance s&rsquo;écrit AAAA-MM-JJ ou JJ/MM/AAAA. Les numéros de membre et les cartes sont créés automatiquement ; les adresses e-mail déjà présentes sont ignorées.</p>
            <form action={importMembersAction} className="mt-4 grid gap-3">
              <input type="file" name="file" accept=".csv,text/csv" required className="block w-full font-body text-[13px] text-white/80 file:mr-3 file:rounded-[7px] file:border file:border-white/20 file:bg-white/[0.05] file:px-3 file:py-2 file:text-white" />
              <div><SubmitButton>Importer</SubmitButton></div>
            </form>
          </Panel>
        )}
      </div>
    </>
  );
}
