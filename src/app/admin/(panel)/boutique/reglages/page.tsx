import { SubmitButton } from "@/components/admin/SubmitButton";
import { Field, Flash, PageHeader, Panel, inp } from "@/components/admin/ui";
import { first, type SP } from "@/lib/admin/params";
import { requireAdmin } from "@/lib/server/admin-auth";
import { shopConfig } from "@/lib/server/shop";
import { saveShopSettingsAction } from "../actions";

export const metadata = { title: "Réglages de la boutique" };

export default async function ShopSettingsPage({ searchParams }: { searchParams: Promise<SP> }) {
  await requireAdmin("shop.pricing");
  const sp = await searchParams;
  const c = await shopConfig.get();
  return (
    <>
      <PageHeader title="Réglages de la boutique" subtitle="Livraison, seuil de stock bas et ordre des catégories. Les codes promotionnels se gèrent dans Communauté > Codes promotionnels." />
      <Flash ok={first(sp.ok)} error={first(sp.erreur)} />
      <Panel>
        <form action={saveShopSettingsAction} className="grid gap-4 sm:grid-cols-3">
          <Field label="Livraison standard (€)"><input name="standard" inputMode="decimal" defaultValue={c.shipping.standardCents / 100} className={inp} /></Field>
          <Field label="Livraison offerte dès (€)"><input name="freeFrom" inputMode="decimal" defaultValue={c.shipping.freeFromCents / 100} className={inp} /></Field>
          <Field label="Seuil de stock bas"><input name="lowStock" type="number" min={0} defaultValue={c.lowStock} className={inp} /></Field>
          <Field label="Catégories (ordre d'affichage, séparées par des virgules)" className="sm:col-span-3"><input name="categories" defaultValue={c.categories.join(", ")} className={inp} /></Field>
          <div className="sm:col-span-3"><SubmitButton>Enregistrer</SubmitButton></div>
        </form>
      </Panel>
    </>
  );
}
