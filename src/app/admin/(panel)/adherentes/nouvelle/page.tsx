import { SubmitButton } from "@/components/admin/SubmitButton";
import { Field, Flash, PageHeader, Panel, inp } from "@/components/admin/ui";
import { eur } from "@/lib/admin/format";
import { first, type SP } from "@/lib/admin/params";
import { requireAdmin } from "@/lib/server/admin-auth";
import { plans } from "@/lib/server/business";
import { createMemberAction } from "../actions";

export const metadata = { title: "Nouvelle adhérente" };

export default async function NewMemberPage({ searchParams }: { searchParams: Promise<SP> }) {
  await requireAdmin("members.edit");
  const sp = await searchParams;
  const list = (await plans.all()).sort((a, b) => a.order - b.order);
  return (
    <>
      <PageHeader back={{ href: "/admin/adherentes", label: "Toutes les adhérentes" }} title="Nouvelle adhérente" subtitle="Adhésion saisie par l'équipe (inscription au guichet, par exemple). La carte et le numéro de membre sont créés automatiquement." />
      <Flash error={first(sp.erreur)} />
      <form action={createMemberAction} className="grid gap-4">
        <Panel title="Identité">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Prénom"><input name="firstName" required className={inp} /></Field>
            <Field label="Nom"><input name="lastName" required className={inp} /></Field>
            <Field label="Date de naissance"><input name="birthDate" type="date" required className={inp} /></Field>
            <Field label="Téléphone"><input name="phone" required className={inp} /></Field>
            <Field label="Adresse e-mail" className="sm:col-span-2"><input name="email" type="email" required className={inp} /></Field>
            <Field label="Adresse" className="sm:col-span-2"><input name="line1" required className={inp} /></Field>
            <Field label="Code postal"><input name="postalCode" required className={inp} /></Field>
            <Field label="Ville"><input name="city" required className={inp} /></Field>
            <Field label="Pays"><input name="country" defaultValue="France" required className={inp} /></Field>
          </div>
        </Panel>
        <Panel title="Responsable légal (si mineure)">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Prénom"><input name="gFirstName" className={inp} /></Field>
            <Field label="Nom"><input name="gLastName" className={inp} /></Field>
            <Field label="Lien"><select name="gRelation" className={inp}><option value="mere">Mère</option><option value="pere">Père</option><option value="tuteur">Représentant légal</option></select></Field>
            <Field label="Téléphone"><input name="gPhone" className={inp} /></Field>
            <Field label="E-mail" className="sm:col-span-2"><input name="gEmail" type="email" className={inp} /></Field>
          </div>
        </Panel>
        <Panel title="Adhésion et paiement">
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Formule"><select name="planId" className={inp}>{list.map((p) => <option key={p.id} value={p.id}>{p.name} · {eur(p.promoPriceCents ?? p.priceCents)}</option>)}</select></Field>
            <Field label="Mode de paiement"><select name="method" className={inp}><option value="manual">À définir</option><option value="virement">Virement</option><option value="cash">Espèces</option><option value="cheque">Chèque</option><option value="online">Carte</option><option value="autre">Autre</option></select></Field>
            <label className="flex items-end gap-2 pb-2.5 font-body text-[13.5px] text-white/85"><input type="checkbox" name="paid" value="1" className="size-4 accent-[#d90f2c]" /> Adhésion déjà réglée</label>
          </div>
        </Panel>
        <div><SubmitButton>Créer l&rsquo;adhérente</SubmitButton></div>
      </form>
    </>
  );
}
