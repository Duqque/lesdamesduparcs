import { SubmitButton } from "@/components/admin/SubmitButton";
import { Field, Flash, PageHeader, Panel, inp } from "@/components/admin/ui";
import { first, type SP } from "@/lib/admin/params";
import { requireAdmin } from "@/lib/server/admin-auth";
import { settings } from "@/lib/server/admin-store";
import { saveInvoiceSettingsAction } from "../actions";

export const metadata = { title: "Modèle de facture" };

function Preview({ src, label }: { src?: string; label: string }) {
  return src ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={label} className="h-28 w-auto max-w-[220px] rounded-[10px] border border-line bg-white object-contain p-2" />
  ) : (
    <span className="grid h-28 w-44 place-items-center rounded-[10px] border border-dashed border-white/25 font-body text-[12px] text-mist">Aucun fichier</span>
  );
}

export default async function InvoiceSettingsPage({ searchParams }: { searchParams: Promise<SP> }) {
  await requireAdmin("settings.edit");
  const sp = await searchParams;
  const { invoice, association } = await settings.get();
  return (
    <>
      <PageHeader title="Modèle de facture" subtitle="Une facture PDF est éditée automatiquement à chaque paiement validé, envoyée par e-mail à la personne et aux administratrices, et conservée dans la fiche de la personne. Aucun numéro de carte ni de chèque n'y figure, seulement le mode de paiement." />
      <Flash ok={first(sp.ok)} error={first(sp.erreur)} />
      <Panel title="Numérotation, mention légale et signataire">
        <form action={saveInvoiceSettingsAction} encType="multipart/form-data" className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Préfixe des numéros" hint="Exemple : FAC donne FAC-2026-0001, FAC-2026-0002…"><input name="prefix" defaultValue={invoice.prefix} maxLength={8} className={inp} /></Field>
          <Field label="Mention légale (TVA)" hint="Affichée sous le total. À confirmer avec votre expert-comptable."><input name="legalNote" defaultValue={invoice.legalNote} className={inp} /></Field>
          <Field label="Signataire (présidente ou trésorière)" hint={`Vide = ${association.president || "présidente"} (données de l'association)`}><input name="signerName" defaultValue={invoice.signerName} className={inp} /></Field>
          <Field label="Fonction du signataire" hint={`Vide = ${association.presidentTitle || "fonction"}`}><input name="signerTitle" defaultValue={invoice.signerTitle} className={inp} /></Field>

          <div className="rounded-[12px] border border-line p-4">
            <p className="font-body text-[12px] font-medium uppercase tracking-[0.12em] text-mist">Tampon de l&rsquo;association (photo)</p>
            <div className="mt-3 flex flex-wrap items-center gap-4">
              <Preview src={invoice.stamp} label="Tampon" />
              <div className="grid min-w-0 flex-1 gap-2">
                <input type="file" name="stampFile" accept="image/png,image/jpeg" className={inp} />
                <label className="flex items-center gap-2 font-body text-[13px] text-white/80"><input type="checkbox" name="stampRemove" className="size-4 accent-[#d90f2c]" /> Retirer le tampon</label>
              </div>
            </div>
          </div>
          <div className="rounded-[12px] border border-line p-4">
            <p className="font-body text-[12px] font-medium uppercase tracking-[0.12em] text-mist">Signature (image)</p>
            <div className="mt-3 flex flex-wrap items-center gap-4">
              <Preview src={invoice.signature} label="Signature" />
              <div className="grid min-w-0 flex-1 gap-2">
                <input type="file" name="signatureFile" accept="image/png,image/jpeg" className={inp} />
                <label className="flex items-center gap-2 font-body text-[13px] text-white/80"><input type="checkbox" name="signatureRemove" className="size-4 accent-[#d90f2c]" /> Retirer la signature</label>
              </div>
            </div>
          </div>
          <p className="font-body text-[12.5px] leading-[1.6] text-mist sm:col-span-2">Photographiez ou scannez le tampon et la signature sur fond blanc (idéalement, un PNG à fond transparent). Formats acceptés : PNG et JPEG. Les images sont enregistrées dans la base de données du site.</p>
          <div className="sm:col-span-2"><SubmitButton>Enregistrer le modèle</SubmitButton></div>
        </form>
      </Panel>
    </>
  );
}
