import { SubmitButton } from "@/components/admin/SubmitButton";
import { Empty, Flash, PageHeader, Panel, TableWrap, Td, Th, inp } from "@/components/admin/ui";
import { first, type SP } from "@/lib/admin/params";
import { requireAdmin } from "@/lib/server/admin-auth";
import { articlesDb } from "@/lib/server/content";
import { renameTaxonomyAction } from "../actions";

export const metadata = { title: "Catégories" };

export default async function TaxonomyPage({ searchParams }: { searchParams: Promise<SP> }) {
  await requireAdmin("content.edit");
  const sp = await searchParams;
  const articles = await articlesDb.all();
  const counts = new Map<string, number>();
  for (const a of articles) for (const v of [a.category]) counts.set(v, (counts.get(v) ?? 0) + 1);
  const rows = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  return (
    <>
      <PageHeader title="Catégories" subtitle="Elles se créent en écrivant un nouveau nom dans un article ; ici, vous les renommez pour toute la base." />
      <Flash ok={first(sp.ok)} error={first(sp.erreur)} />
      <Panel flush>
        {rows.length === 0 ? <Empty>Aucun élément.</Empty> : (
          <TableWrap>
            <thead><tr><Th>Nom</Th><Th>Articles</Th><Th>Renommer</Th></tr></thead>
            <tbody>
              {rows.map(([name, n]) => (
                <tr key={name}>
                  <Td className="text-white">{name}</Td>
                  <Td className="tabular-nums">{n}</Td>
                  <Td>
                    <form action={renameTaxonomyAction.bind(null, "category")} className="flex gap-2">
                      <input type="hidden" name="from" value={name} />
                      <input name="to" placeholder="Nouveau nom" className={inp + " max-w-[220px]"} />
                      <SubmitButton variant="small">Renommer</SubmitButton>
                    </form>
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
