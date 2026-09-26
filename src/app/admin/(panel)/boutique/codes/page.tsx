import { SubmitButton } from "@/components/admin/SubmitButton";
import { Badge, Empty, Field, Flash, PageHeader, Panel, TableWrap, Td, Th, inp } from "@/components/admin/ui";
import { eur, fmtDateLong } from "@/lib/admin/format";
import { first, type SP } from "@/lib/admin/params";
import { requireAdmin } from "@/lib/server/admin-auth";
import { promoCodes } from "@/lib/server/content";
import { deleteShopCodeAction, saveShopCodeAction, toggleShopCodeAction } from "../actions";

export const metadata = { title: "Codes de réduction" };

const today = () => new Date().toISOString().slice(0, 10);

export default async function ShopCodesPage({ searchParams }: { searchParams: Promise<SP> }) {
  await requireAdmin("shop.pricing");
  const sp = await searchParams;
  const rows = (await promoCodes.find((p) => p.scope === "shop" || p.scope === "all")).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const editId = first(sp.edit);
  const editing = rows.find((r) => r.id === editId);
  const status = (p: (typeof rows)[number]) => {
    if (!p.active) return <Badge>Désactivé</Badge>;
    if (p.endsAt && p.endsAt < today()) return <Badge tone="red">Expiré</Badge>;
    if (p.startsAt && p.startsAt > today()) return <Badge tone="blue">À venir</Badge>;
    if (p.maxUses && p.uses >= p.maxUses) return <Badge tone="orange">Épuisé</Badge>;
    return <Badge tone="green">Actif</Badge>;
  };
  return (
    <>
      <PageHeader title="Codes de réduction" subtitle="Codes que les clientes saisissent au moment de commander dans la boutique. La réduction est toujours recalculée par le serveur au paiement." />
      <Flash ok={first(sp.ok)} error={first(sp.erreur)} />
      <Panel title={editing ? `Modifier le code ${editing.code}` : "Créer un code de réduction"} className="mb-4">
        <form key={editing?.id ?? "new"} action={saveShopCodeAction} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <input type="hidden" name="id" value={editing?.id ?? ""} />
          <Field label="Code" hint="Laissez vide pour en générer un automatiquement."><input name="code" defaultValue={editing?.code} placeholder="ex. BIENVENUE10" maxLength={24} className={inp + " uppercase"} /></Field>
          <Field label="Libellé (interne)"><input name="label" defaultValue={editing?.label} className={inp} /></Field>
          <Field label="Type de réduction">
            <select name="type" defaultValue={editing?.type ?? "percent"} className={inp}><option value="percent">Pourcentage (%)</option><option value="amount">Montant fixe (€)</option></select>
          </Field>
          <Field label="Valeur" hint="10 pour 10 % ou pour 10 €."><input name="value" inputMode="decimal" required defaultValue={editing ? (editing.type === "percent" ? editing.value : editing.value / 100) : ""} className={inp} /></Field>
          <Field label="Panier minimum (€)" hint="0 : aucun minimum."><input name="min" inputMode="decimal" defaultValue={editing?.minCents ? editing.minCents / 100 : ""} className={inp} /></Field>
          <Field label="Utilisations maximum" hint="0 : illimité."><input name="maxUses" type="number" min={0} defaultValue={editing?.maxUses ?? ""} className={inp} /></Field>
          <Field label="Valable à partir du"><input name="startsAt" type="date" defaultValue={editing?.startsAt} className={inp} /></Field>
          <Field label="Valable jusqu'au"><input name="endsAt" type="date" defaultValue={editing?.endsAt} className={inp} /></Field>
          <label className="flex items-end gap-2 pb-2.5 font-body text-[13.5px] text-white/85"><input type="checkbox" name="active" defaultChecked={editing ? editing.active : true} className="size-4 accent-[#d90f2c]" /> Code actif</label>
          <div className="flex items-end gap-3 sm:col-span-2 lg:col-span-3">
            <SubmitButton>{editing ? "Enregistrer" : "Créer le code"}</SubmitButton>
            {editing && <a href="/admin/boutique/codes" className="font-body text-[13.5px] text-mist underline underline-offset-4 hover:text-white">Annuler la modification</a>}
          </div>
        </form>
      </Panel>
      <Panel title="Codes existants" flush>
        {rows.length === 0 ? <Empty>Aucun code de réduction pour le moment.</Empty> : (
          <TableWrap>
            <thead><tr><Th>Code</Th><Th>Réduction</Th><Th>Conditions</Th><Th>Utilisations</Th><Th>Statut</Th><Th>Actions</Th></tr></thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.id} className="align-top">
                  <Td><span className="font-mono text-[13.5px] text-white">{p.code}</span>{p.label && <span className="block text-[12px] text-mist">{p.label}</span>}</Td>
                  <Td className="tabular-nums">{p.type === "percent" ? `${p.value} %` : eur(p.value)}</Td>
                  <Td className="text-[12.5px] text-mist">
                    {p.minCents ? `Dès ${eur(p.minCents)} d'achats` : "Sans minimum"}
                    <br />
                    {p.startsAt || p.endsAt ? `${p.startsAt ? `du ${fmtDateLong(p.startsAt)}` : ""} ${p.endsAt ? `au ${fmtDateLong(p.endsAt)}` : ""}`.trim() : "Sans limite de date"}
                    {p.scope === "all" && <><br />Aussi valable hors boutique</>}
                  </Td>
                  <Td className="tabular-nums">{p.uses}{p.maxUses ? ` / ${p.maxUses}` : ""}</Td>
                  <Td>{status(p)}</Td>
                  <Td>
                    <div className="flex flex-wrap gap-2">
                      <a href={`/admin/boutique/codes?edit=${p.id}`} className="inline-flex h-8 items-center rounded-[8px] border border-white/20 px-3 font-body text-[12.5px] text-white hover:border-white/45">Modifier</a>
                      <form action={toggleShopCodeAction.bind(null, p.id)}><SubmitButton variant="small">{p.active ? "Désactiver" : "Activer"}</SubmitButton></form>
                      <form action={deleteShopCodeAction.bind(null, p.id)}><SubmitButton variant="danger" confirm={`Supprimer définitivement le code ${p.code} ?`}>Supprimer</SubmitButton></form>
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        )}
      </Panel>
    </>
  );
}
