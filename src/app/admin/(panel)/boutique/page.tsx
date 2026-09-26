/* eslint-disable @next/next/no-html-link-for-pages -- exports de fichiers */
import Link from "next/link";
import Image from "next/image";
import { Plus } from "lucide-react";
import { Badge, Empty, Flash, LinkButton, PageHeader, Panel, TableWrap, Td, Th, btn, inp, lbl, type Tone } from "@/components/admin/ui";
import { eur } from "@/lib/admin/format";
import { first, pick, type SP } from "@/lib/admin/params";
import { cn } from "@/lib/cn";
import { requireAdmin } from "@/lib/server/admin-auth";
import { productsDb, shopConfig, totalStock } from "@/lib/server/shop";

export const metadata = { title: "Produits" };

const ST: Record<string, [string, Tone]> = { draft: ["Brouillon", "grey"], active: ["En vente", "green"], archived: ["Archivé", "grey"] };

export default async function ProductsPage({ searchParams }: { searchParams: Promise<SP> }) {
  const ctx = await requireAdmin("shop.view");
  const sp = await searchParams;
  const f = pick(sp, ["q", "statut", "categorie", "stock"] as const);
  const [all, cfg] = await Promise.all([productsDb.all(), shopConfig.get()]);
  const rows = all.filter((p) => (!f.statut || p.status === f.statut) && (!f.categorie || p.category === f.categorie) && (!f.q || `${p.name} ${p.sku ?? ""}`.toLowerCase().includes(f.q.toLowerCase())) && (!f.stock || (f.stock === "bas" ? totalStock(p) <= cfg.lowStock && totalStock(p) > 0 : totalStock(p) <= 0))).sort((a, b) => a.order - b.order);
  const cats = [...new Set(all.map((p) => p.category))];
  return (
    <>
      <PageHeader title="Produits" subtitle={`${rows.length} produit(s). Seuil de stock bas : ${cfg.lowStock}.`} actions={<>{ctx.can("shop.edit") && <LinkButton href="/admin/boutique/nouveau" variant="primary"><Plus aria-hidden className="size-4" /> Nouveau produit</LinkButton>}<a href="/admin/export/produits?format=csv" className={btn.outline}>Exporter</a></>} />
      <Flash ok={first(sp.ok)} error={first(sp.erreur)} />
      <Panel className="mb-4" title="Filtres">
        <form method="get" className="grid grid-cols-1 gap-3 sm:grid-cols-5">
          <label className="sm:col-span-2"><span className={lbl}>Nom ou référence</span><input name="q" defaultValue={f.q} className={cn(inp, "mt-1.5")} /></label>
          <label><span className={lbl}>Statut</span><select name="statut" defaultValue={f.statut ?? ""} className={cn(inp, "mt-1.5")}><option value="">Tous</option>{Object.entries(ST).map(([k, [l]]) => <option key={k} value={k}>{l}</option>)}</select></label>
          <label><span className={lbl}>Catégorie</span><select name="categorie" defaultValue={f.categorie ?? ""} className={cn(inp, "mt-1.5")}><option value="">Toutes</option>{cats.map((c) => <option key={c}>{c}</option>)}</select></label>
          <label><span className={lbl}>Stock</span><select name="stock" defaultValue={f.stock ?? ""} className={cn(inp, "mt-1.5")}><option value="">Tous</option><option value="bas">Stock bas</option><option value="rupture">Rupture</option></select></label>
          <div className="flex gap-2 sm:col-span-5"><button className={btn.primary}>Filtrer</button><Link href="/admin/boutique" className={btn.outline}>Réinitialiser</Link></div>
        </form>
      </Panel>
      <Panel flush>
        {rows.length === 0 ? <Empty>Aucun produit.</Empty> : (
          <TableWrap>
            <thead><tr><Th>Produit</Th><Th>Catégorie</Th><Th>Prix</Th><Th>Stock</Th><Th>Statut</Th></tr></thead>
            <tbody>
              {rows.map((p) => {
                const t = totalStock(p);
                const [sl, st] = ST[p.status];
                return (
                  <tr key={p.id} className="hover:bg-white/[0.02]">
                    <Td>
                      <Link href={`/admin/boutique/${p.id}`} className="flex items-center gap-3">
                        <span className="relative block h-12 w-9 shrink-0 overflow-hidden rounded-[6px] bg-[#e9ebee]"><Image src={p.images[0] ?? "/images/produit-echarpe.webp"} alt="" fill sizes="36px" className="object-cover object-top" /></span>
                        <span><span className="block font-medium text-white">{p.name}</span><span className="text-[12px] text-mist">{p.sku}</span></span>
                      </Link>
                    </Td>
                    <Td>{p.category}</Td>
                    <Td className="tabular-nums">{p.priceCents ? eur(p.priceCents) : "—"}{p.compareAtCents ? <span className="ml-2 text-[12px] text-mist line-through">{eur(p.compareAtCents)}</span> : null}</Td>
                    <Td>{!p.trackStock ? <span className="text-mist">Non suivi</span> : t <= 0 ? <Badge tone="red">Rupture</Badge> : t <= cfg.lowStock ? <Badge tone="orange">Bas · {t}</Badge> : <span className="tabular-nums">{t}</span>}</Td>
                    <Td><Badge tone={st}>{sl}</Badge></Td>
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
