import { SubmitButton } from "@/components/admin/SubmitButton";
import { Badge, Field, Flash, PageHeader, Panel, area, inp } from "@/components/admin/ui";
import { eur } from "@/lib/admin/format";
import { first, type SP } from "@/lib/admin/params";
import { requireAdmin } from "@/lib/server/admin-auth";
import { memberships, plans, type Plan } from "@/lib/server/business";
import { deletePlanAction, savePlanAction } from "../actions";

export const metadata = { title: "Formules d'adhésion" };

function PlanForm({ plan }: { plan?: Plan }) {
  return (
    <form action={savePlanAction} className="grid gap-4 sm:grid-cols-2">
      {plan && <input type="hidden" name="id" value={plan.id} />}
      <Field label="Nom" className="sm:col-span-2"><input name="name" defaultValue={plan?.name} required className={inp} /></Field>
      <Field label="Description" className="sm:col-span-2"><textarea name="description" defaultValue={plan?.description} rows={2} className={area} /></Field>
      <Field label="Prix (€)"><input name="price" defaultValue={plan ? plan.priceCents / 100 : ""} inputMode="decimal" required className={inp} /></Field>
      <Field label="Prix promotionnel (€), facultatif"><input name="promo" defaultValue={plan?.promoPriceCents !== undefined ? plan.promoPriceCents / 100 : ""} inputMode="decimal" className={inp} /></Field>
      <Field label="Durée en mois (0 = saison)"><input name="duration" defaultValue={plan?.durationMonths ?? 0} inputMode="numeric" className={inp} /></Field>
      <Field label="Ordre d'affichage"><input name="order" defaultValue={plan?.order ?? 10} inputMode="numeric" className={inp} /></Field>
      <Field label="Image (adresse)" className="sm:col-span-2"><input name="image" defaultValue={plan?.image} placeholder="/medias/… ou /images/…" className={inp} /></Field>
      <Field label="Avantages (un par ligne)" className="sm:col-span-2"><textarea name="benefits" defaultValue={plan?.benefits.join("\n")} rows={4} className={area} /></Field>
      <Field label="Conditions" className="sm:col-span-2"><textarea name="conditions" defaultValue={plan?.conditions} rows={2} className={area} /></Field>
      <div className="flex flex-wrap gap-5 sm:col-span-2">
        {([["visible", "Visible sur le site", plan?.visible ?? true], ["available", "Disponible à l'adhésion", plan?.available ?? true], ["autoRenew", "Renouvellement automatique", plan?.autoRenew ?? false]] as const).map(([n, l, v]) => (
          <label key={n} className="flex items-center gap-2 font-body text-[13.5px] text-white/85"><input type="checkbox" name={n} defaultChecked={v} className="size-4 accent-[#d90f2c]" />{l}</label>
        ))}
      </div>
      <div className="flex gap-2 sm:col-span-2"><SubmitButton>{plan ? "Enregistrer" : "Créer la formule"}</SubmitButton></div>
    </form>
  );
}

export default async function PlansPage({ searchParams }: { searchParams: Promise<SP> }) {
  await requireAdmin("plans.manage");
  const sp = await searchParams;
  const [list, ms] = await Promise.all([plans.all(), memberships.all()]);
  return (
    <>
      <PageHeader title="Formules d'adhésion" subtitle="Créez et ajustez les formules proposées aux supportrices. La formule visible et disponible en premier est celle du parcours d'inscription du site." />
      <Flash ok={first(sp.ok)} error={first(sp.erreur)} />
      <div className="space-y-4">
        {list.sort((a, b) => a.order - b.order).map((p) => (
          <Panel key={p.id} title={<span className="flex items-center gap-3">{p.name} <Badge tone={p.visible && p.available ? "green" : "grey"}>{p.visible && p.available ? "En ligne" : "Masquée"}</Badge></span>} action={<span className="font-body text-[13px] text-mist">{eur(p.promoPriceCents ?? p.priceCents)} · {ms.filter((m) => m.planId === p.id).length} adhésion(s)</span>}>
            <details>
              <summary className="cursor-pointer font-body text-[13.5px] text-white/80 hover:text-white">Modifier</summary>
              <div className="mt-5"><PlanForm plan={p} /></div>
              <form action={deletePlanAction.bind(null, p.id)} className="mt-4 border-t border-line pt-4"><SubmitButton variant="danger" confirm="Supprimer cette formule ?">Supprimer la formule</SubmitButton></form>
            </details>
          </Panel>
        ))}
        <Panel title="Nouvelle formule"><PlanForm /></Panel>
      </div>
    </>
  );
}
