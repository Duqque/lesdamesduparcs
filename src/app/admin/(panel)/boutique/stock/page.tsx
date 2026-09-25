import { SubmitButton } from "@/components/admin/SubmitButton";
import { Badge, Empty, Flash, PageHeader, Panel, TableWrap, Td, Th, inp } from "@/components/admin/ui";
import { first, type SP } from "@/lib/admin/params";
import { NO_SIZE } from "@/lib/shop";
import { requireAdmin } from "@/lib/server/admin-auth";
import { productsDb, shopConfig, totalStock } from "@/lib/server/shop";
import { updateStockAction } from "../actions";

export const metadata = { title: "Stock" };

export default async function StockPage({ searchParams }: { searchParams: Promise<SP> }) {
  const ctx = await requireAdmin("shop.view");
  const sp = await searchParams;
  const [all, cfg] = await Promise.all([productsDb.all(), shopConfig.get()]);
  const rows = all.filter((p) => p.status !== "archived").sort((a, b) => totalStock(a) - totalStock(b));
  const edit = ctx.can("shop.stock");
  const low = rows.filter((p) => p.trackStock && totalStock(p) <= cfg.lowStock).length;
  return (
    <>
      <PageHeader title="Stock" subtitle={`${low} produit(s) en stock bas ou en rupture (seuil : ${cfg.lowStock}). Les produits les plus bas sont en premier.`} />
      <Flash ok={first(sp.ok)} error={first(sp.erreur)} />
      <Panel flush>
        {rows.length === 0 ? <Empty>Aucun produit.</Empty> : (
          <TableWrap>
            <thead><tr><Th>Produit</Th><Th>Total</Th><Th>Quantités</Th></tr></thead>
            <tbody>
              {rows.map((p) => {
                const t = totalStock(p);
                const keys = p.sizes.length ? p.sizes : [NO_SIZE];
                return (
                  <tr key={p.id} className="align-top">
                    <Td><span className="block font-medium text-white">{p.name}</span><span className="text-[12px] text-mist">{p.sku}</span></Td>
                    <Td>{!p.trackStock ? <span className="text-mist">Non suivi</span> : t <= 0 ? <Badge tone="red">Rupture</Badge> : t <= cfg.lowStock ? <Badge tone="orange">Bas · {t}</Badge> : <span className="tabular-nums">{t}</span>}</Td>
                    <Td>
                      <form action={updateStockAction.bind(null, p.id)} className="flex flex-wrap items-end gap-2">
                        {keys.map((k) => (
                          <label key={k} className="block"><span className="font-body text-[11.5px] text-mist">{k === NO_SIZE ? "Qté" : k}</span><input name={`stock:${k}`} type="number" min={0} defaultValue={p.stock[k] ?? 0} disabled={!edit} className={inp + " mt-1 w-[76px]"} /></label>
                        ))}
                        {edit && <SubmitButton variant="small">Enregistrer</SubmitButton>}
                      </form>
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </TableWrap>
        )}
      </Panel>
    </>
  );
}
