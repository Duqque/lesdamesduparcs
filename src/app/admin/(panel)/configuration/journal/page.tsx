import Link from "next/link";
import { Badge, Empty, PageHeader, Pagination, Panel, TableWrap, Td, Th, btn, inp, lbl } from "@/components/admin/ui";
import { fmtDateTime } from "@/lib/admin/format";
import { first, href, pick, type SP } from "@/lib/admin/params";
import { cn } from "@/lib/cn";
import { requireAdmin } from "@/lib/server/admin-auth";
import { auditLog, loginEvents } from "@/lib/server/admin-store";

export const metadata = { title: "Journal d'activité" };

const PAGE = 40;

export default async function JournalPage({ searchParams }: { searchParams: Promise<SP> }) {
  await requireAdmin("audit.view");
  const sp = await searchParams;
  const vue = first(sp.vue) === "connexions" ? "connexions" : "actions";
  const f = pick(sp, ["q", "action", "entite"] as const);
  const page = Math.max(1, Number(first(sp.page)) || 1);
  const [log, logins] = await Promise.all([auditLog.all(), loginEvents.all()]);
  const q = f.q?.toLowerCase();
  const rows = log.filter((e) => (!f.action || e.action === f.action) && (!f.entite || e.entity === f.entite) && (!q || `${e.actorName} ${e.label}`.toLowerCase().includes(q))).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const conns = logins.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const list = vue === "actions" ? rows : conns;
  const pages = Math.max(1, Math.ceil(list.length / PAGE));
  const actions = [...new Set(log.map((e) => e.action))];
  const entities = [...new Set(log.map((e) => e.entity))];
  return (
    <>
      <PageHeader title="Journal d'activité" subtitle="Qui a fait quoi, quand, sur quel élément, avec l'ancienne et la nouvelle valeur. Les connexions (réussies ou non) sont aussi conservées." />
      <nav className="mb-4 flex gap-1">
        {([["actions", "Actions"], ["connexions", "Connexions"]] as const).map(([k, l]) => <Link key={k} href={href("/admin/configuration/journal", { vue: k })} aria-current={vue === k ? "true" : undefined} className={cn("rounded-[7px] px-3 py-1.5 font-body text-[13px]", vue === k ? "bg-white/[0.12] text-white" : "text-mist hover:text-white")}>{l}</Link>)}
      </nav>
      {vue === "actions" && (
        <Panel className="mb-4" title="Filtres">
          <form method="get" className="grid gap-3 sm:grid-cols-4">
            <label><span className={lbl}>Recherche</span><input name="q" defaultValue={f.q} className={cn(inp, "mt-1.5")} /></label>
            <label><span className={lbl}>Action</span><select name="action" defaultValue={f.action ?? ""} className={cn(inp, "mt-1.5")}><option value="">Toutes</option>{actions.map((a) => <option key={a}>{a}</option>)}</select></label>
            <label><span className={lbl}>Élément</span><select name="entite" defaultValue={f.entite ?? ""} className={cn(inp, "mt-1.5")}><option value="">Tous</option>{entities.map((a) => <option key={a}>{a}</option>)}</select></label>
            <div className="flex items-end gap-2"><button className={btn.primary}>Filtrer</button></div>
          </form>
        </Panel>
      )}
      <Panel flush>
        {list.length === 0 ? <Empty>Aucune entrée.</Empty> : vue === "actions" ? (
          <>
            <TableWrap>
              <thead><tr><Th>Date</Th><Th>Utilisatrice</Th><Th>Action</Th><Th>Élément</Th><Th>Détail</Th><Th>Avant → après</Th></tr></thead>
              <tbody>
                {rows.slice((page - 1) * PAGE, page * PAGE).map((e) => (
                  <tr key={e.id} className="align-top">
                    <Td className="tabular-nums text-[12.5px]">{fmtDateTime(e.createdAt)}</Td>
                    <Td>{e.actorName}</Td><Td><Badge>{e.action}</Badge></Td><Td>{e.entity}</Td>
                    <Td className="max-w-[320px]">{e.label}</Td>
                    <Td className="max-w-[260px] break-words font-mono text-[11.5px] text-mist">{e.before !== undefined || e.after !== undefined ? `${JSON.stringify(e.before ?? null)} → ${JSON.stringify(e.after ?? null)}` : ""}</Td>
                  </tr>
                ))}
              </tbody>
            </TableWrap>
            <Pagination page={page} pages={pages} hrefFor={(p) => href("/admin/configuration/journal", { ...f, vue, page: p })} />
          </>
        ) : (
          <>
            <TableWrap>
              <thead><tr><Th>Date</Th><Th>Adresse e-mail</Th><Th>Résultat</Th><Th>Adresse IP</Th><Th>Détail</Th></tr></thead>
              <tbody>
                {conns.slice((page - 1) * PAGE, page * PAGE).map((e) => (
                  <tr key={e.id}><Td className="tabular-nums text-[12.5px]">{fmtDateTime(e.createdAt)}</Td><Td>{e.email}</Td><Td><Badge tone={e.success ? "green" : "red"}>{e.success ? "Réussie" : "Échec"}</Badge></Td><Td className="text-[12.5px]">{e.ip}</Td><Td className="text-mist">{e.reason ?? ""}</Td></tr>
                ))}
              </tbody>
            </TableWrap>
            <Pagination page={page} pages={pages} hrefFor={(p) => href("/admin/configuration/journal", { vue, page: p })} />
          </>
        )}
      </Panel>
    </>
  );
}
