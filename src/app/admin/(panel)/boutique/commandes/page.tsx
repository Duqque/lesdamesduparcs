import Link from "next/link";
import { Download } from "lucide-react";
import { PAY_TONE } from "@/components/admin/status";
import { Badge, Empty, Flash, PageHeader, Pagination, Panel, TableWrap, Td, Th, btn, inp, lbl, type Tone } from "@/components/admin/ui";
import { eur, fmtDate } from "@/lib/admin/format";
import { first, href, pick, type SP } from "@/lib/admin/params";
import { cn } from "@/lib/cn";
import type { Fulfilment } from "@/lib/orders";
import { requireAdmin } from "@/lib/server/admin-auth";
import { listOrders } from "@/lib/server/store";

export const metadata = { title: "Commandes" };

const FULFIL_LABEL: Record<Fulfilment, string> = { to_prepare: "À préparer", preparing: "En préparation", shipped: "Expédiée", ready_for_pickup: "Prête au retrait", delivered: "Livrée / retirée" };
const FULFIL_TONE: Record<Fulfilment, Tone> = { to_prepare: "orange", preparing: "blue", shipped: "blue", ready_for_pickup: "blue", delivered: "green" };
const PAY: Record<string, [string, "paid" | "pending" | "refunded" | "cancelled"]> = { paid: ["Payée", "paid"], awaiting_payment: ["En attente", "pending"], refunded: ["Remboursée", "refunded"], cancelled: ["Annulée", "cancelled"] };
const PAGE = 25;

export default async function OrdersPage({ searchParams }: { searchParams: Promise<SP> }) {
  const ctx = await requireAdmin("shop.orders");
  const sp = await searchParams;
  const f = pick(sp, ["q", "paiement", "suivi", "du", "au"] as const);
  const page = Math.max(1, Number(first(sp.page)) || 1);
  const q = f.q?.toLowerCase();
  const all = (await listOrders()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const rows = all.filter((o) => (!f.paiement || o.status === f.paiement) && (!f.suivi || (f.suivi === "aucun" ? !o.fulfilment : o.fulfilment === f.suivi)) && (!f.du || o.createdAt.slice(0, 10) >= f.du) && (!f.au || o.createdAt.slice(0, 10) <= f.au) && (!q || `${o.id} ${o.contact.firstName} ${o.contact.lastName} ${o.contact.email}`.toLowerCase().includes(q)));
  const pages = Math.max(1, Math.ceil(rows.length / PAGE));
  const qs = new URLSearchParams(Object.entries(f).filter(([, v]) => v) as [string, string][]).toString();
  return (
    <>
      <PageHeader title="Commandes" subtitle={`${rows.length} commande(s) · ${all.filter((o) => o.status === "paid" && (o.fulfilment === "to_prepare" || !o.fulfilment)).length} à préparer.`} actions={<a href={`/admin/export/commandes?format=csv&${qs}`} className={btn.outline}><Download aria-hidden className="size-4" /> Exporter</a>} />
      <Flash ok={first(sp.ok)} error={first(sp.erreur)} />
      <Panel className="mb-4" title="Filtres">
        <form method="get" className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <label className="lg:col-span-2"><span className={lbl}>N°, nom ou e-mail</span><input name="q" defaultValue={f.q} className={cn(inp, "mt-1.5")} /></label>
          <label><span className={lbl}>Paiement</span><select name="paiement" defaultValue={f.paiement ?? ""} className={cn(inp, "mt-1.5")}><option value="">Tous</option>{Object.entries(PAY).map(([k, [l]]) => <option key={k} value={k}>{l}</option>)}</select></label>
          <label><span className={lbl}>Suivi</span><select name="suivi" defaultValue={f.suivi ?? ""} className={cn(inp, "mt-1.5")}><option value="">Tous</option><option value="aucun">Non payée</option>{Object.entries(FULFIL_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></label>
          <label><span className={lbl}>Du</span><input type="date" name="du" defaultValue={f.du} className={cn(inp, "mt-1.5")} /></label>
          <label><span className={lbl}>Au</span><input type="date" name="au" defaultValue={f.au} className={cn(inp, "mt-1.5")} /></label>
          <div className="flex gap-2 sm:col-span-3 lg:col-span-6"><button className={btn.primary}>Filtrer</button><Link href="/admin/boutique/commandes" className={btn.outline}>Réinitialiser</Link></div>
        </form>
      </Panel>
      <Panel flush>
        {rows.length === 0 ? <Empty>Aucune commande.</Empty> : (
          <>
            <TableWrap>
              <thead><tr><Th>N°</Th><Th>Date</Th><Th>Client</Th><Th>Articles</Th>{ctx.can("finance.view") && <Th>Total</Th>}<Th>Paiement</Th><Th>Suivi</Th><Th>Livraison</Th></tr></thead>
              <tbody>
                {rows.slice((page - 1) * PAGE, page * PAGE).map((o) => {
                  const [pl, pt] = PAY[o.status];
                  return (
                    <tr key={o.id} className="hover:bg-white/[0.02]">
                      <Td><Link href={`/admin/boutique/commandes/${o.id}`} className="font-medium text-white hover:underline">{o.id.slice(0, 8).toUpperCase()}</Link></Td>
                      <Td className="tabular-nums">{fmtDate(o.createdAt)}</Td>
                      <Td><span className="block text-white">{o.contact.firstName} {o.contact.lastName}</span><span className="text-[12px] text-mist">{o.contact.email}</span></Td>
                      <Td className="tabular-nums">{o.lines.reduce((n, l) => n + l.qty, 0)}</Td>
                      {ctx.can("finance.view") && <Td className="tabular-nums">{eur(o.totalCents)}</Td>}
                      <Td><Badge tone={PAY_TONE[pt]}>{pl}</Badge></Td>
                      <Td>{o.status === "paid" && o.fulfilment ? <Badge tone={FULFIL_TONE[o.fulfilment]}>{FULFIL_LABEL[o.fulfilment]}</Badge> : o.status === "paid" ? <Badge tone="orange">À préparer</Badge> : <span className="text-mist">—</span>}</Td>
                      <Td>{o.delivery.mode === "home" ? "Domicile" : "Retrait événement"}</Td>
                    </tr>
                  );
                })}
              </tbody>
            </TableWrap>
            <Pagination page={page} pages={pages} hrefFor={(p) => href("/admin/boutique/commandes", { ...f, page: p })} />
          </>
        )}
      </Panel>
    </>
  );
}
