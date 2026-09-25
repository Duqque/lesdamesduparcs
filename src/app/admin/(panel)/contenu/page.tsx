import Link from "next/link";
import { Plus } from "lucide-react";
import { Badge, Empty, Flash, LinkButton, PageHeader, Panel, TableWrap, Td, Th, btn, inp, lbl, type Tone } from "@/components/admin/ui";
import { fmtDate } from "@/lib/admin/format";
import { first, pick, type SP } from "@/lib/admin/params";
import { cn } from "@/lib/cn";
import { requireAdmin } from "@/lib/server/admin-auth";
import { articlesDb } from "@/lib/server/content";

export const metadata = { title: "Articles" };

const ST: Record<string, [string, Tone]> = { draft: ["Brouillon", "grey"], scheduled: ["Programmé", "blue"], published: ["Publié", "green"], archived: ["Archivé", "grey"] };

export default async function ArticlesPage({ searchParams }: { searchParams: Promise<SP> }) {
  await requireAdmin("content.edit");
  const sp = await searchParams;
  const f = pick(sp, ["statut", "categorie", "q"] as const);
  const all = (await articlesDb.all()).sort((a, b) => b.date.localeCompare(a.date));
  const rows = all.filter((a) => (!f.statut || a.status === f.statut) && (!f.categorie || a.category === f.categorie) && (!f.q || a.title.toLowerCase().includes(f.q.toLowerCase())));
  const cats = [...new Set(all.map((a) => a.category))];
  return (
    <>
      <PageHeader title="Articles" subtitle={`${rows.length} article(s).`} actions={<LinkButton href="/admin/contenu/nouveau" variant="primary"><Plus aria-hidden className="size-4" /> Nouvel article</LinkButton>} />
      <Flash ok={first(sp.ok)} error={first(sp.erreur)} />
      <Panel className="mb-4" title="Filtres">
        <form method="get" className="grid gap-3 sm:grid-cols-4">
          <label className="sm:col-span-2"><span className={lbl}>Titre</span><input name="q" defaultValue={f.q} className={cn(inp, "mt-1.5")} /></label>
          <label><span className={lbl}>Statut</span><select name="statut" defaultValue={f.statut ?? ""} className={cn(inp, "mt-1.5")}><option value="">Tous</option>{Object.entries(ST).map(([k, [l]]) => <option key={k} value={k}>{l}</option>)}</select></label>
          <label><span className={lbl}>Catégorie</span><select name="categorie" defaultValue={f.categorie ?? ""} className={cn(inp, "mt-1.5")}><option value="">Toutes</option>{cats.map((c) => <option key={c}>{c}</option>)}</select></label>
          <div className="flex gap-2"><button className={btn.primary}>Filtrer</button><Link href="/admin/contenu" className={btn.outline}>Réinitialiser</Link></div>
        </form>
      </Panel>
      <Panel flush>
        {rows.length === 0 ? <Empty>Aucun article.</Empty> : (
          <TableWrap>
            <thead><tr><Th>Article</Th><Th>Auteure</Th><Th>Catégorie</Th><Th>Statut</Th><Th>Date</Th><Th>Vues</Th></tr></thead>
            <tbody>
              {rows.map((a) => {
                const [l, t] = ST[a.status];
                return (
                  <tr key={a.id} className="hover:bg-white/[0.02]">
                    <Td><Link href={`/admin/contenu/${a.id}`} className="font-medium text-white hover:underline">{a.title}</Link></Td>
                    <Td>{a.authorName}</Td><Td>{a.category}</Td>
                    <Td><Badge tone={t}>{l}</Badge></Td>
                    <Td className="tabular-nums">{fmtDate(a.publishAt ?? a.date)}</Td>
                    <Td className="tabular-nums">{a.views}</Td>
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
