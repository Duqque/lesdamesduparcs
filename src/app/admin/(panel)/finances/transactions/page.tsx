import Link from "next/link";
import { Download } from "lucide-react";
import { SubmitButton } from "@/components/admin/SubmitButton";
import { PAY_TONE } from "@/components/admin/status";
import { Badge, Empty, Flash, PageHeader, Pagination, Panel, TableWrap, Td, Th, btn, inp, lbl } from "@/components/admin/ui";
import { eur, fmtDate, num } from "@/lib/admin/format";
import { first, href, pick, type SP } from "@/lib/admin/params";
import { cn } from "@/lib/cn";
import { requireAdmin } from "@/lib/server/admin-auth";
import { TX_STATUS_LABEL, getTransactions } from "@/lib/server/business";
import { remindAction, txStatusAction } from "../actions";

export const metadata = { title: "Transactions" };

const KEYS = ["q", "statut", "type", "du", "au"] as const;
const PAGE_SIZE = 30;
const TITLE: Record<string, string> = { pending: "Paiements en attente", failed: "Paiements échoués", refunded: "Remboursements", paid: "Paiements reçus", cancelled: "Paiements annulés" };

export default async function TransactionsPage({ searchParams }: { searchParams: Promise<SP> }) {
  const ctx = await requireAdmin("finance.view");
  const sp = await searchParams;
  const f = pick(sp, KEYS);
  const page = Math.max(1, Number(first(sp.page)) || 1);
  const q = f.q?.toLowerCase();
  const all = await getTransactions();
  const rows = all.filter((t) => (!f.statut || t.status === f.statut) && (!f.type || t.type === f.type) && (!f.du || t.at.slice(0, 10) >= f.du) && (!f.au || t.at.slice(0, 10) <= f.au) && (!q || [t.name, t.email, t.label, t.reference].some((v) => v?.toLowerCase().includes(q))));
  const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const shown = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const total = rows.filter((t) => t.status === "paid").reduce((n, t) => n + t.amountCents, 0);
  const here = href("/admin/finances/transactions", { ...f, page: page > 1 ? page : undefined });
  const qs = new URLSearchParams(Object.entries(f).filter(([, v]) => v) as [string, string][]).toString();
  const edit = ctx.can("finance.edit");

  return (
    <>
      <PageHeader
        title={f.statut ? TITLE[f.statut] ?? "Transactions" : "Transactions"}
        subtitle={`${num(rows.length)} transaction(s) · ${eur(total)} encaissés dans cette sélection.`}
        actions={ctx.can("finance.export") && (
          <>
            <a href={`/admin/export/transactions?format=csv&${qs}`} className={btn.outline}><Download aria-hidden className="size-4" /> CSV / Excel</a>
            <a href={`/admin/export/transactions?format=pdf&${qs}`} className={btn.outline}><Download aria-hidden className="size-4" /> PDF</a>
          </>
        )}
      />
      <Flash ok={first(sp.ok)} error={first(sp.erreur)} />
      <Panel className="mb-4" title="Filtres">
        <form className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5" method="get">
          <label className="lg:col-span-2"><span className={lbl}>Nom, e-mail, objet, référence</span><input name="q" defaultValue={f.q} className={cn(inp, "mt-1.5")} /></label>
          <label><span className={lbl}>Statut</span><select name="statut" defaultValue={f.statut ?? ""} className={cn(inp, "mt-1.5")}><option value="">Tous</option>{Object.entries(TX_STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
          <label><span className={lbl}>Type</span><select name="type" defaultValue={f.type ?? ""} className={cn(inp, "mt-1.5")}><option value="">Tous</option>{["Adhésion", "Événement", "Boutique", "Autre"].map((t) => <option key={t}>{t}</option>)}</select></label>
          <div className="flex items-end gap-2"><button className={btn.primary}>Filtrer</button><Link href="/admin/finances/transactions" className={btn.outline}>Réinitialiser</Link></div>
          <label><span className={lbl}>Du</span><input type="date" name="du" defaultValue={f.du} className={cn(inp, "mt-1.5")} /></label>
          <label><span className={lbl}>Au</span><input type="date" name="au" defaultValue={f.au} className={cn(inp, "mt-1.5")} /></label>
        </form>
      </Panel>
      <Panel flush>
        {shown.length === 0 ? <Empty>Aucune transaction.</Empty> : (
          <>
            <TableWrap>
              <thead><tr><Th>Date</Th><Th>Nom</Th><Th>Type</Th><Th>Objet</Th><Th>Montant</Th><Th>Méthode</Th><Th>Statut</Th><Th>Référence</Th>{edit && <Th>Actions</Th>}</tr></thead>
              <tbody>
                {shown.map((t) => (
                  <tr key={t.id} className="hover:bg-white/[0.02]">
                    <Td className="tabular-nums">{fmtDate(t.at)}</Td>
                    <Td><span className="block text-white">{t.name}</span><span className="text-[12px] text-mist">{t.email}</span></Td>
                    <Td>{t.type}</Td>
                    <Td className="max-w-[260px] truncate" >{t.label}</Td>
                    <Td className="tabular-nums">{eur(t.amountCents)}</Td>
                    <Td>{t.method}</Td>
                    <Td><Badge tone={PAY_TONE[t.status]}>{TX_STATUS_LABEL[t.status]}</Badge></Td>
                    <Td className="text-[12px] text-mist">{t.reference}</Td>
                    {edit && (
                      <Td>
                        <div className="flex flex-wrap gap-1.5">
                          {t.status !== "paid" && t.status !== "cancelled" && t.status !== "refunded" && <form action={txStatusAction.bind(null, t.id, "paid", here)}><SubmitButton variant="small">Marquer payé</SubmitButton></form>}
                          {(t.status === "pending" || t.status === "failed") && t.email && <form action={remindAction.bind(null, t.id, here)}><SubmitButton variant="small">Relancer</SubmitButton></form>}
                          {(t.status === "pending" || t.status === "failed") && <form action={txStatusAction.bind(null, t.id, "cancelled", here)}><SubmitButton variant="small" confirm="Annuler cette transaction ?">Annuler</SubmitButton></form>}
                          {t.status === "paid" && <form action={txStatusAction.bind(null, t.id, "refunded", here)}><SubmitButton variant="small" confirm="Marquer comme remboursée ? Si le paiement a été fait par carte via Stripe, le remboursement est effectué automatiquement chez Stripe.">Rembourser</SubmitButton></form>}
                        </div>
                      </Td>
                    )}
                  </tr>
                ))}
              </tbody>
            </TableWrap>
            <Pagination page={page} pages={pages} hrefFor={(p) => href("/admin/finances/transactions", { ...f, page: p })} />
          </>
        )}
      </Panel>
    </>
  );
}
