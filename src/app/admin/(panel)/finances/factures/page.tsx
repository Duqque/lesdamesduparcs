import { FileText } from "lucide-react";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { SubmitButton } from "@/components/admin/SubmitButton";
import { Empty, Flash, PageHeader, Panel, TableWrap, Td, Th } from "@/components/admin/ui";
import { eur, fmtDate } from "@/lib/admin/format";
import { first, type SP } from "@/lib/admin/params";
import { audit, requireAdmin } from "@/lib/server/admin-auth";
import { invoices, issueMissingInvoices } from "@/lib/server/invoice";

export const metadata = { title: "Factures" };

async function generateMissing() {
  "use server";
  const ctx = await requireAdmin("finance.edit");
  const n = await issueMissingInvoices();
  await audit(ctx, "création", "factures", `${n} facture(s) éditée(s) pour des paiements déjà validés`);
  revalidatePath("/admin/finances/factures");
  redirect(`/admin/finances/factures?ok=${encodeURIComponent(n ? `${n} facture(s) éditée(s) pour des paiements déjà validés (sans envoi d'e-mail).` : "Tous les paiements validés ont déjà leur facture.")}`);
}

export default async function InvoicesPage({ searchParams }: { searchParams: Promise<SP> }) {
  const ctx = await requireAdmin("finance.view");
  const sp = await searchParams;
  const q = (first(sp.q) ?? "").toLowerCase();
  const all = (await invoices.all()).sort((a, b) => b.issuedAt.localeCompare(a.issuedAt));
  const list = q ? all.filter((i) => `${i.number} ${i.name} ${i.label} ${i.memberNumber ?? ""}`.toLowerCase().includes(q)) : all;
  const total = list.reduce((n, i) => n + i.amountCents, 0);
  return (
    <>
      <PageHeader title="Factures" subtitle={`${all.length} facture(s) conservée(s). Chaque paiement validé en génère une, automatiquement, rattachée à la fiche de la personne.`} />
      <Flash ok={first(sp.ok)} error={first(sp.erreur)} />
      <Panel flush title={`${list.length} facture(s) · ${eur(total)}`}>
        <form className="flex flex-wrap items-center gap-3 p-4">
          <input name="q" defaultValue={first(sp.q)} placeholder="Numéro, nom, objet…" className="h-11 min-w-0 flex-1 rounded-[8px] border border-line bg-night-900 px-3 font-body text-[14px] text-white" />
          <button className="h-11 rounded-[8px] border border-line px-4 font-body text-[13.5px] text-white hover:border-white/30">Rechercher</button>
        </form>
        {ctx.can("finance.edit") && <form action={generateMissing} className="px-4 pb-4"><SubmitButton variant="outline">Éditer les factures manquantes (paiements déjà validés)</SubmitButton></form>}
        {list.length === 0 ? <Empty>Aucune facture pour le moment.</Empty> : (
          <TableWrap>
            <thead><tr><Th>Numéro</Th><Th>Date</Th><Th>Personne</Th><Th>Objet</Th><Th>Mode</Th><Th>Montant</Th><Th>PDF</Th></tr></thead>
            <tbody>
              {list.map((i) => (
                <tr key={i.id}>
                  <Td className="tabular-nums font-medium text-white">{i.number}</Td>
                  <Td className="tabular-nums">{fmtDate(i.issuedAt)}</Td>
                  <Td>{i.memberNumber ? <a href={`/admin/adherentes?q=${encodeURIComponent(i.memberNumber)}`} className="underline decoration-white/25 underline-offset-4 hover:decoration-white">{i.name}</a> : i.name}</Td>
                  <Td className="max-w-[260px] truncate">{i.label}</Td>
                  <Td>{i.methodLabel}</Td>
                  <Td className="tabular-nums">{eur(i.amountCents)}</Td>
                  <Td><a href={`/api/factures/${i.id}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-white underline decoration-white/25 underline-offset-4 hover:decoration-white"><FileText aria-hidden className="size-4" /> Ouvrir</a></Td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        )}
      </Panel>
    </>
  );
}
