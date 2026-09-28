import Link from "next/link";
import { Download, Plus, Upload } from "lucide-react";
import { Badge, Empty, Flash, LinkButton, PageHeader, Pagination, Panel, TableWrap, Td, Th, btn, inp, lbl } from "@/components/admin/ui";
import { fmtDate, num } from "@/lib/admin/format";
import { first, href, pick, type SP } from "@/lib/admin/params";
import { requireAdmin } from "@/lib/server/admin-auth";
import { filterMembers, loadMemberRows, type MemberFilters } from "@/lib/server/admin-data";
import { plans, TX_STATUS_LABEL } from "@/lib/server/business";
import { cn } from "@/lib/cn";
import { PAY_TONE, STATUS_LABEL, STATUS_TONE } from "@/components/admin/status";
import { SubmitButton } from "@/components/admin/SubmitButton";
import { deleteProfileAction } from "./actions";
import { ExportSubmit } from "./ExportSubmit";

export const metadata = { title: "Adhérentes" };

const KEYS = ["q", "vue", "plan", "statut", "paiement", "ville", "age", "du", "au", "expDu", "expAu", "mineure", "type", "tri"] as const;

const EXPORT_COLS: Array<[string, string, boolean]> = [["num", "N° membre", true], ["nom", "Nom", true], ["prenom", "Prénom", true], ["email", "E-mail", true], ["tel", "Téléphone", true], ["naissance", "Date de naissance", true], ["ville", "Ville", true], ["cp", "Code postal", true], ["type", "Carte (adhérente ou profil)", false], ["formule", "Formule", false], ["statut", "Statut de l'adhésion", false], ["paiement", "Statut du paiement", true], ["adhesion", "Date d'adhésion", true], ["expiration", "Expiration", true]];
const PAGE_SIZE = 25;

const TITLES: Record<string, string> = { nouvelles: "Nouvelles adhésions", renouvellements: "Renouvellements", expirees: "Adhésions expirées", retard: "Paiements en retard" };

export default async function MembersPage({ searchParams }: { searchParams: Promise<SP> }) {
  const ctx = await requireAdmin("members.view");
  const sp = await searchParams;
  const f = pick(sp, KEYS) as MemberFilters;
  const page = Math.max(1, Number(first(sp.page)) || 1);
  const [all, planList] = await Promise.all([loadMemberRows(), plans.all()]);
  const rows = filterMembers(all, f);
  const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const shown = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const pii = ctx.can("members.pii");
  const finance = ctx.can("finance.view");
  const mk = (extra: Record<string, string | number | undefined>) => href("/admin/adherentes", { ...f, ...extra });
  const exportQs = new URLSearchParams(Object.entries(f).filter(([, v]) => v) as [string, string][]).toString();
  const sort = (k: string) => mk({ tri: f.tri === k ? `-${k}` : k, page: undefined });

  return (
    <>
      <PageHeader
        title={f.vue ? TITLES[f.vue] ?? "Adhérentes" : "Adhérentes"}
        subtitle={`${num(rows.length)} résultat${rows.length > 1 ? "s" : ""} sur ${num(all.length)} adhérentes.`}
        actions={
          <>
            {ctx.can("members.edit") && <LinkButton href="/admin/adherentes/nouvelle" variant="primary"><Plus aria-hidden className="size-4" /> Nouvelle adhérente</LinkButton>}
            {ctx.can("members.export") && (
              <>
                <LinkButton href="/admin/adherentes/import-export"><Upload aria-hidden className="size-4" /> Importer</LinkButton>
                <a href="#export" className={btn.outline}><Download aria-hidden className="size-4" /> Exporter</a>
              </>
            )}
          </>
        }
      />
      <Flash ok={first(sp.ok)} error={first(sp.erreur)} />

      {ctx.can("members.export") && (
        <Panel className="mb-4" title="Exporter la liste (colonnes au choix)">
          <form id="export" method="get" action="/admin/export/adherentes" className="grid gap-4">
            {Object.entries(f).filter(([, v]) => v).map(([k, v]) => <input key={k} type="hidden" name={k} value={String(v)} />)}
            <input type="hidden" name="cols" value="" />
            <fieldset>
              <legend className={lbl}>Colonnes du document</legend>
              <div className="mt-2 grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-3 lg:grid-cols-4">
                {EXPORT_COLS.map(([k, l, on]) => (
                  <label key={k} className="flex items-center gap-2 font-body text-[13.5px] text-white/85"><input type="checkbox" data-export-col={k} defaultChecked={on} className="size-4 accent-[#d90f2c]" /> {l}</label>
                ))}
              </div>
            </fieldset>
            <div className="flex flex-wrap items-end gap-3">
              <label><span className={lbl}>Format</span><select name="format" className={cn(inp, "mt-1.5")}><option value="csv">CSV</option><option value="csv">Excel (CSV, s&rsquo;ouvre dans Excel)</option><option value="pdf">PDF</option></select></label>
              <ExportSubmit />
              <span className="font-body text-[12.5px] text-mist">Les filtres ci-dessous s&rsquo;appliquent à l&rsquo;export.</span>
            </div>
          </form>
        </Panel>
      )}

      <Panel className="mb-4" title="Filtres">
        <form method="get" autoComplete="off" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="lg:col-span-2"><span className={lbl}>Nom, prénom, e-mail, téléphone, numéro</span><input name="q" defaultValue={f.q} className={cn(inp, "mt-1.5")} placeholder="Rechercher" /></label>
          <label><span className={lbl}>Formule</span><select name="plan" defaultValue={f.plan ?? ""} className={cn(inp, "mt-1.5")}><option value="">Toutes</option>{planList.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
          <label><span className={lbl}>Statut</span><select name="statut" defaultValue={f.statut ?? ""} className={cn(inp, "mt-1.5")}><option value="">Tous</option>{(["active", "expired", "suspended"] as const).map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}</select></label>
          {finance && <label><span className={lbl}>Paiement</span><select name="paiement" defaultValue={f.paiement ?? ""} className={cn(inp, "mt-1.5")}><option value="">Tous</option>{(["paid", "pending", "failed", "refunded"] as const).map((s) => <option key={s} value={s}>{TX_STATUS_LABEL[s]}</option>)}</select></label>}
          <label><span className={lbl}>Ville</span><input name="ville" defaultValue={f.ville} className={cn(inp, "mt-1.5")} /></label>
          {pii && <label><span className={lbl}>Tranche d&rsquo;âge</span><select name="age" defaultValue={f.age ?? ""} className={cn(inp, "mt-1.5")}><option value="">Toutes</option>{["<18", "18-25", "26-35", "36-50", "50+"].map((a) => <option key={a} value={a}>{a === "<18" ? "Moins de 18 ans" : a === "50+" ? "Plus de 50 ans" : `${a.replace("-", " à ")} ans`}</option>)}</select></label>}
          <label><span className={lbl}>Inscrite du</span><input type="date" name="du" defaultValue={f.du} className={cn(inp, "mt-1.5")} /></label>
          <label><span className={lbl}>au</span><input type="date" name="au" defaultValue={f.au} className={cn(inp, "mt-1.5")} /></label>
          <label><span className={lbl}>Expire du</span><input type="date" name="expDu" defaultValue={f.expDu} className={cn(inp, "mt-1.5")} /></label>
          <label><span className={lbl}>au</span><input type="date" name="expAu" defaultValue={f.expAu} className={cn(inp, "mt-1.5")} /></label>
          <label><span className={lbl}>Type de profil</span><select name="type" defaultValue={f.type ?? ""} className={cn(inp, "mt-1.5")}><option value="">Tous</option><option value="adherente">Adhérentes (carte payée)</option><option value="profil">Profils créés (carte non payée)</option></select></label>
          <label><span className={lbl}>Vue</span><select name="vue" defaultValue={f.vue ?? ""} className={cn(inp, "mt-1.5")}><option value="">Toutes</option>{Object.entries(TITLES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
          <div className="flex items-end gap-2 lg:col-span-1">
            <button type="submit" className={btn.primary}>Filtrer</button>
            <Link href="/admin/adherentes" className={btn.outline}>Réinitialiser</Link>
          </div>
        </form>
      </Panel>

      <Panel flush>
        {shown.length === 0 ? (
          <Empty>Aucune adhérente ne correspond à ces critères.</Empty>
        ) : (
          <>
            <TableWrap>
              <thead>
                <tr>
                  <Th><Link href={sort("nom")} className="hover:text-white">Nom</Link></Th>
                  <Th>Formule</Th>
                  <Th>Profil</Th>
                  <Th><Link href={sort("statut")} className="hover:text-white">Statut</Link></Th>
                  {finance && <Th>Paiement</Th>}
                  <Th><Link href={sort("joined")} className="hover:text-white">Adhésion</Link></Th>
                  <Th><Link href={sort("exp")} className="hover:text-white">Expiration</Link></Th>
                  {ctx.can("members.delete") && <Th>Action</Th>}
                </tr>
              </thead>
              <tbody>
                {shown.map((r) => (
                  <tr key={r.member.id} className="hover:bg-white/[0.02]">
                    <Td>
                      <Link href={`/admin/adherentes/${r.member.id}`} className="block">
                        <span className="block font-medium text-white">{r.member.firstName} {r.member.lastName}{r.age < 18 && <span className="ml-2 text-[11px] text-mist">mineure</span>}</span>
                        <span className="block text-[12.5px] text-mist">{r.member.email}</span>
                      </Link>
                    </Td>
                    <Td>{r.planName || "—"}</Td>
                    <Td>{r.kind === "adherente" ? <Badge tone="green">Adhérente</Badge> : <Badge tone="orange">Profil créé</Badge>}</Td>
                    <Td><Badge tone={STATUS_TONE[r.status]}>{STATUS_LABEL[r.status]}</Badge></Td>
                    {finance && <Td>{r.payment ? <Badge tone={PAY_TONE[r.payment]}>{TX_STATUS_LABEL[r.payment]}</Badge> : "—"}</Td>}
                    <Td className="tabular-nums">{fmtDate(r.joinedAt)}</Td>
                    <Td className="tabular-nums">{fmtDate(r.expiresAt)}</Td>
                    {ctx.can("members.delete") && <Td>{r.kind === "profil" ? <form action={deleteProfileAction.bind(null, r.member.id)}><SubmitButton variant="danger" confirm={`Supprimer définitivement le profil de ${r.member.firstName} ${r.member.lastName} ? Il n'a pas de carte payée : sa fiche et ses paiements non réglés seront supprimés.`}>Supprimer</SubmitButton></form> : null}</Td>}
                  </tr>
                ))}
              </tbody>
            </TableWrap>
            <Pagination page={page} pages={pages} hrefFor={(p) => mk({ page: p })} />
          </>
        )}
      </Panel>
    </>
  );
}
