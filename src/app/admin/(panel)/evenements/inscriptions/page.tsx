import Link from "next/link";
import { RegistrationsTable } from "@/components/admin/RegistrationsTable";
import { Flash, PageHeader, Panel, btn, inp, lbl } from "@/components/admin/ui";
import { first, type SP } from "@/lib/admin/params";
import { cn } from "@/lib/cn";
import { requireAdmin } from "@/lib/server/admin-auth";
import { getAllEventsAdmin } from "@/lib/server/events";
import { listAllRegistrations } from "@/lib/server/store";

export const metadata = { title: "Inscriptions" };

/** Toutes les inscriptions, ou seulement la liste d'attente (?vue=attente), ou les présences (?vue=presences). */
export default async function RegistrationsPage({ searchParams, vue = "toutes" }: { searchParams: Promise<SP>; vue?: "toutes" | "attente" | "presences" }) {
  const ctx = await requireAdmin("events.attendance");
  const sp = await searchParams;
  const evId = first(sp.evenement);
  const statut = first(sp.statut);
  const q = first(sp.q)?.toLowerCase();
  const [events, all] = await Promise.all([getAllEventsAdmin(), listAllRegistrations()]);
  const title = (id: string) => events.find((e) => e.id === id)?.title ?? id;
  let rows = all.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  if (vue === "attente") rows = rows.filter((r) => r.status === "waitlist");
  if (vue === "presences") rows = rows.filter((r) => r.status !== "cancelled" && r.status !== "refunded" && r.status !== "waitlist");
  if (evId) rows = rows.filter((r) => r.eventId === evId);
  if (statut) rows = rows.filter((r) => r.status === statut);
  if (q) rows = rows.filter((r) => `${r.firstName} ${r.lastName} ${r.email}`.toLowerCase().includes(q));
  const base = vue === "attente" ? "/admin/evenements/liste-attente" : vue === "presences" ? "/admin/evenements/presences" : "/admin/evenements/inscriptions";
  const heading = vue === "attente" ? "Listes d'attente" : vue === "presences" ? "Présences" : "Inscriptions";

  return (
    <>
      <PageHeader title={heading} subtitle={`${rows.length} ligne(s).`} />
      <Flash ok={first(sp.ok)} error={first(sp.erreur)} />
      <Panel className="mb-4" title="Filtres">
        <form method="get" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label><span className={lbl}>Événement</span><select name="evenement" defaultValue={evId ?? ""} className={cn(inp, "mt-1.5")}><option value="">Tous</option>{events.map((e) => <option key={e.id} value={e.id}>{e.title}</option>)}</select></label>
          {vue === "toutes" && <label><span className={lbl}>Statut</span><select name="statut" defaultValue={statut ?? ""} className={cn(inp, "mt-1.5")}><option value="">Tous</option><option value="confirmed">Confirmée</option><option value="paid">Payée</option><option value="awaiting_payment">Paiement en attente</option><option value="waitlist">Liste d&rsquo;attente</option><option value="cancelled">Annulée</option><option value="refunded">Remboursée</option></select></label>}
          <label><span className={lbl}>Nom ou e-mail</span><input name="q" defaultValue={q} className={cn(inp, "mt-1.5")} /></label>
          <div className="flex items-end gap-2"><button className={btn.primary}>Filtrer</button><Link href={base} className={btn.outline}>Réinitialiser</Link></div>
        </form>
      </Panel>
      <Panel flush>
        <RegistrationsTable rows={rows} returnTo={base} eventTitle={title} canEdit canFinance={ctx.can("finance.edit")} showAttendance={vue !== "attente"} showFinance={ctx.can("finance.view")} />
      </Panel>
    </>
  );
}
