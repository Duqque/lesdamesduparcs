/* eslint-disable @next/next/no-html-link-for-pages -- téléchargements de fichiers (routes d'export), pas des pages */
import { Download } from "lucide-react";
import { SubmitButton } from "@/components/admin/SubmitButton";
import { Flash, PageHeader, Panel, btn } from "@/components/admin/ui";
import { first, type SP } from "@/lib/admin/params";
import { requireAdmin } from "@/lib/server/admin-auth";
import { importMembersAction, sendPendingFirstLoginEmailsAction } from "../actions";
import { listStoredMembers } from "@/lib/server/store";

export const metadata = { title: "Import / export" };

export default async function ImportExportPage({ searchParams }: { searchParams: Promise<SP> }) {
  const ctx = await requireAdmin("members.export");
  const sp = await searchParams;
  const pending = (await listStoredMembers()).filter((m) => m.firstLogin && !m.firstLogin.sentAt && m.status !== "anonymized" && m.status !== "expelled");
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
        {ctx.can("members.edit") && (
          <Panel title="E-mail de première connexion">
            <p className="font-body text-[13.5px] text-mist">Les comptes importés ou créés par l&rsquo;équipe n&rsquo;ont pas encore de mot de passe. Cet e-mail leur envoie un lien personnel (valable 7 jours, à usage unique) pour le choisir et se connecter. Il peut aussi être envoyé ou renvoyé depuis chaque fiche.</p>
            <p className="mt-3 font-body text-[13.5px] text-white">{pending.length ? `${pending.length} adhérente${pending.length > 1 ? "s" : ""} en attente : ${pending.slice(0, 6).map((m) => `${m.firstName} ${m.lastName}`).join(", ")}${pending.length > 6 ? "…" : ""}` : "Aucune adhérente en attente."}</p>
            {pending.length > 0 && (
              <form action={sendPendingFirstLoginEmailsAction} className="mt-4">
                <SubmitButton confirm={`Envoyer l'e-mail de première connexion à ${pending.length} adhérente${pending.length > 1 ? "s" : ""} ?`}>Envoyer l&rsquo;e-mail de première connexion ({pending.length})</SubmitButton>
              </form>
            )}
          </Panel>
        )}
      </div>
    </>
  );
}
