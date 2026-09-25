import { SubmitButton } from "@/components/admin/SubmitButton";
import { Field, Flash, PageHeader, Panel, inp } from "@/components/admin/ui";
import { first, type SP } from "@/lib/admin/params";
import { requireAdmin } from "@/lib/server/admin-auth";
import { settings } from "@/lib/server/admin-store";
import { saveSettingsAction } from "../actions";

export const metadata = { title: "Données de l'association" };

const FIELDS: Array<[string, string]> = [
  ["name", "Nom"], ["legalName", "Dénomination légale"], ["form", "Forme juridique"], ["siret", "SIRET"], ["rna", "Numéro RNA"],
  ["address", "Adresse"], ["postalCode", "Code postal"], ["city", "Ville"], ["phone", "Téléphone"], ["email", "E-mail de contact"],
  ["website", "Site internet"], ["president", "Présidente"], ["presidentTitle", "Fonction de la signataire"],
  ["instagram", "Instagram (adresse)"], ["tiktok", "TikTok (adresse)"], ["x", "X (adresse)"], ["facebook", "Facebook (adresse)"], ["youtube", "YouTube (adresse)"],
];

export default async function AssociationPage({ searchParams }: { searchParams: Promise<SP> }) {
  await requireAdmin("settings.edit");
  const sp = await searchParams;
  const { association } = await settings.get();
  return (
    <>
      <PageHeader title="Données de l'association" subtitle="Ces informations apparaissent sur l'attestation d'adhésion PDF, la page de vérification et le pied de page. Les valeurs de départ sont fictives : renseignez les vraies." />
      <Flash ok={first(sp.ok)} error={first(sp.erreur)} />
      <Panel>
        <form action={saveSettingsAction.bind(null, "association")} className="grid gap-4 sm:grid-cols-2">
          {FIELDS.map(([k, l]) => <Field key={k} label={l}><input name={k} defaultValue={(association as unknown as Record<string, string>)[k]} className={inp} /></Field>)}
          <div className="sm:col-span-2"><SubmitButton>Enregistrer</SubmitButton></div>
        </form>
      </Panel>
    </>
  );
}
