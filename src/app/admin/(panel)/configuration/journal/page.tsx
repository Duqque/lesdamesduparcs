import Link from "next/link";
import { Badge, Empty, PageHeader, Pagination, Panel, TableWrap, Td, Th, btn, inp, lbl } from "@/components/admin/ui";
import { fmtDateTime } from "@/lib/admin/format";
import { first, href, pick, type SP } from "@/lib/admin/params";
import { cn } from "@/lib/cn";
import { requireAdmin } from "@/lib/server/admin-auth";
import { auditLog, loginEvents } from "@/lib/server/admin-store";

export const metadata = { title: "Journal d'activité" };

const PAGE = 40;

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
/** Noms de champs techniques traduits pour la lecture. */
const KEYWORD: Record<string, string> = { src: "photo", alt: "texte alternatif", title: "titre", text: "texte", status: "statut", time: "heure", priceCents: "prix", price: "prix", label: "libellé", email: "e-mail" };
const word = (k: string) => KEYWORD[k] ?? k;

/**
 * Ce qui a changé, en deux mots-clés au plus (ex. « bento-1, pourquoi », « statut », « draft → published »),
 * au lieu des deux valeurs complètes.
 */
function changed(before: unknown, after: unknown): string {
  if (before === undefined && after === undefined) return "";
  if (isObj(before) && isObj(after)) {
    const keys = [...new Set([...Object.keys(before), ...Object.keys(after)])].filter((k) => !same(before[k], after[k]));
    // Un seul bloc modifié : on précise le champ touché à l'intérieur (ex. « pourquoi › texte alternatif »).
    if (keys.length === 1 && isObj(before[keys[0]]) && isObj(after[keys[0]])) {
      const inner = changed(before[keys[0]], after[keys[0]]).split(", ")[0];
      return inner ? `${word(keys[0])} › ${inner}` : word(keys[0]);
    }
    return keys.slice(0, 2).map(word).join(", ");
  }
  const short = (v: unknown) => (v === null || v === undefined ? "—" : typeof v === "string" || typeof v === "number" || typeof v === "boolean" ? String(v) : null);
  const a = short(before), b = short(after);
  if (a !== null && b !== null && a.length <= 20 && b.length <= 20) return `${a} → ${b}`;
  return before === undefined || before === null ? "ajout" : after === undefined || after === null ? "retrait" : "contenu";
}

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
      <PageHeader title="Journal d'activité" subtitle="Qui a fait quoi, quand, sur quel élément, et ce qui a été modifié. Les connexions (réussies ou non) sont aussi conservées." />
      <nav className="mb-4 flex gap-1">
        {([["actions", "Actions"], ["connexions", "Connexions"]] as const).map(([k, l]) => <Link key={k} href={href("/admin/configuration/journal", { vue: k })} aria-current={vue === k ? "true" : undefined} className={cn("rounded-[7px] px-3 py-1.5 font-body text-[13px]", vue === k ? "bg-white/[0.12] text-white" : "text-mist hover:text-white")}>{l}</Link>)}
      </nav>
      {vue === "actions" && (
        <Panel className="mb-4" title="Filtres">
          <form method="get" className="grid grid-cols-1 gap-3 sm:grid-cols-4">
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
              <thead><tr><Th>Date</Th><Th>Utilisatrice</Th><Th>Action</Th><Th>Élément</Th><Th>Détail</Th><Th>Modifié</Th></tr></thead>
              <tbody>
                {rows.slice((page - 1) * PAGE, page * PAGE).map((e) => (
                  <tr key={e.id} className="align-top">
                    <Td className="tabular-nums text-[12.5px]">{fmtDateTime(e.createdAt)}</Td>
                    <Td>{e.actorName}</Td><Td><Badge>{e.action}</Badge></Td><Td>{e.entity}</Td>
                    <Td className="max-w-[320px]">{e.label}</Td>
                    <Td className="max-w-[220px] break-words text-[12.5px] text-mist">{changed(e.before, e.after)}</Td>
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
