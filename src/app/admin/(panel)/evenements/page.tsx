import Link from "next/link";
import { Plus } from "lucide-react";
import { Badge, Empty, Flash, LinkButton, PageHeader, Panel, TableWrap, Td, Th, btn, inp, lbl, type Tone } from "@/components/admin/ui";
import { eur, fmtDate } from "@/lib/admin/format";
import { first, pick, type SP } from "@/lib/admin/params";
import { cn } from "@/lib/cn";
import { requireAdmin } from "@/lib/server/admin-auth";
import { getAllEventsAdmin } from "@/lib/server/events";
import { listAllRegistrations, takenPlaces } from "@/lib/server/store";

export const metadata = { title: "Événements" };

const STATUS: Record<string, [string, Tone]> = { draft: ["Brouillon", "grey"], scheduled: ["Planifié", "blue"], published: ["Publié", "green"], archived: ["Archivé", "grey"] };

export default async function EventsAdminPage({ searchParams }: { searchParams: Promise<SP> }) {
  const ctx = await requireAdmin("events.view");
  const sp = await searchParams;
  const f = pick(sp, ["statut", "categorie", "periode", "q"] as const);
  const [all, regs] = await Promise.all([getAllEventsAdmin(), listAllRegistrations()]);
  const today = new Date().toISOString().slice(0, 10);
  const rows = all.filter((e) => (!f.statut || (e.status ?? "published") === f.statut) && (!f.categorie || e.tag === f.categorie) && (!f.periode || (f.periode === "avenir" ? e.date >= today : e.date < today)) && (!f.q || `${e.title} ${e.venue}`.toLowerCase().includes(f.q.toLowerCase())));
  const finance = ctx.can("finance.view");

  return (
    <>
      <PageHeader title="Événements" subtitle={`${rows.length} événement(s).`} actions={ctx.can("events.edit") && <LinkButton href="/admin/evenements/nouveau" variant="primary"><Plus aria-hidden className="size-4" /> Créer un événement</LinkButton>} />
      <Flash ok={first(sp.ok)} error={first(sp.erreur)} />
      <Panel className="mb-4" title="Filtres">
        <form method="get" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <label className="lg:col-span-2"><span className={lbl}>Titre ou lieu</span><input name="q" defaultValue={f.q} className={cn(inp, "mt-1.5")} /></label>
          <label><span className={lbl}>Statut</span><select name="statut" defaultValue={f.statut ?? ""} className={cn(inp, "mt-1.5")}><option value="">Tous</option>{Object.entries(STATUS).map(([k, [l]]) => <option key={k} value={k}>{l}</option>)}</select></label>
          <label><span className={lbl}>Catégorie</span><select name="categorie" defaultValue={f.categorie ?? ""} className={cn(inp, "mt-1.5")}><option value="">Toutes</option>{["Programme", "Matchday", "Soirée", "Atelier", "Membres", "Déplacement"].map((t) => <option key={t}>{t}</option>)}</select></label>
          <label><span className={lbl}>Période</span><select name="periode" defaultValue={f.periode ?? ""} className={cn(inp, "mt-1.5")}><option value="">Toutes</option><option value="avenir">À venir</option><option value="passe">Passés</option></select></label>
          <div className="flex items-end gap-2"><button className={btn.primary}>Filtrer</button><Link href="/admin/evenements" className={btn.outline}>Réinitialiser</Link></div>
        </form>
      </Panel>
      <Panel flush>
        {rows.length === 0 ? <Empty>Aucun événement.</Empty> : (
          <TableWrap>
            <thead><tr><Th>Date</Th><Th>Événement</Th><Th>Catégorie</Th><Th>Statut</Th><Th>Inscrites</Th>{finance && <Th>Recettes</Th>}</tr></thead>
            <tbody>
              {rows.map((e) => {
                const list = regs.filter((r) => r.eventId === e.id);
                const taken = takenPlaces(list);
                const cap = e.registration.capacity;
                const [sl, st] = STATUS[e.status ?? "published"];
                return (
                  <tr key={e.id} className="hover:bg-white/[0.02]">
                    <Td className="tabular-nums">{fmtDate(e.date)}<span className="block text-[12px] text-mist">{e.time}</span></Td>
                    <Td><Link href={`/admin/evenements/${e.id}`} className="block"><span className="block font-medium text-white">{e.title}</span><span className="text-[12.5px] text-mist">{e.venue}</span></Link></Td>
                    <Td>{e.tag}</Td>
                    <Td><Badge tone={st}>{sl}</Badge></Td>
                    <Td className="tabular-nums">{e.registration.mode === "form" ? `${taken} / ${cap}` : "—"}</Td>
                    {finance && <Td className="tabular-nums">{eur(list.filter((r) => r.status === "paid").reduce((n, r) => n + r.amountCents, 0))}</Td>}
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
