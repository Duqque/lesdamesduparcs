import Link from "next/link";
import { notFound } from "next/navigation";
import { Download, ExternalLink, Pencil } from "lucide-react";
import { QrScanner } from "@/components/admin/QrScanner";
import { RegistrationsTable } from "@/components/admin/RegistrationsTable";
import { SubmitButton } from "@/components/admin/SubmitButton";
import { Badge, Flash, Kpi, PageHeader, Panel, btn, inp } from "@/components/admin/ui";
import { eur, fmtDateLong } from "@/lib/admin/format";
import { first, type SP } from "@/lib/admin/params";
import { cn } from "@/lib/cn";
import { requireAdmin } from "@/lib/server/admin-auth";
import { getEventAdmin } from "@/lib/server/events";
import { listAllRegistrations, takenPlaces } from "@/lib/server/store";
import { checkinAction, deleteEventAction, setEventStatusAction } from "../actions";

export const metadata = { title: "Événement" };

const STATUS = { draft: ["Brouillon", "grey"], scheduled: ["Planifié", "blue"], published: ["Publié", "green"], archived: ["Archivé", "grey"] } as const;

export default async function EventDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<SP> }) {
  const ctx = await requireAdmin("events.view");
  const { id } = await params;
  const sp = await searchParams;
  const ev = await getEventAdmin(id);
  if (!ev) notFound();
  const vue = first(sp.vue) === "attente" ? "attente" : first(sp.vue) === "presences" ? "presences" : "inscrites";
  const regs = (await listAllRegistrations()).filter((r) => r.eventId === id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const active = regs.filter((r) => r.status !== "cancelled" && r.status !== "refunded" && r.status !== "waitlist");
  const wait = regs.filter((r) => r.status === "waitlist");
  const cap = ev.registration.capacity;
  const taken = takenPlaces(regs);
  const paid = regs.filter((r) => r.status === "paid");
  const [sl, st] = STATUS[ev.status ?? "published"];
  const finance = ctx.can("finance.view");
  const can = ctx.can("events.attendance");
  const tabs = [["inscrites", `Inscrites (${active.length})`], ["attente", `Liste d'attente (${wait.length})`], ["presences", "Présences"]] as const;
  const shown = vue === "attente" ? wait : vue === "presences" ? active : regs;
  const returnTo = `/admin/evenements/${id}?vue=${vue}`;
  const present = active.filter((r) => r.attended === true).length;

  return (
    <>
      <PageHeader
        back={{ href: "/admin/evenements", label: "Tous les événements" }}
        title={ev.title}
        subtitle={<span className="flex flex-wrap items-center gap-3"><span>{fmtDateLong(ev.date)} · {ev.time}</span><span>{ev.venue}</span><Badge tone={st}>{sl}</Badge>{cap > 0 && taken >= cap && <Badge tone="red">Complet</Badge>}</span>}
        actions={
          <>
            <Link href={`/evenements/${id}`} className={btn.outline}><ExternalLink aria-hidden className="size-4" /> Page publique</Link>
            {ctx.can("events.edit") && <Link href={`/admin/evenements/${id}/modifier`} className={btn.primary}><Pencil aria-hidden className="size-4" /> Modifier</Link>}
          </>
        }
      />
      <Flash ok={first(sp.ok)} error={first(sp.erreur)} />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-6">
        <Kpi label="Inscrites" value={`${taken}${cap ? ` / ${cap}` : ""}`} />
        {finance && <Kpi label="Payées" value={paid.length} />}
        {finance && <Kpi label="En attente" value={regs.filter((r) => r.status === "awaiting_payment").length} tone={regs.some((r) => r.status === "awaiting_payment") ? "orange" : undefined} />}
        <Kpi label="Places disponibles" value={cap ? Math.max(cap - taken, 0) : "—"} />
        {finance && <Kpi label="Recettes" value={eur(paid.reduce((n, r) => n + r.amountCents, 0))} />}
        <Kpi label="Remplissage" value={cap ? `${Math.round((taken / cap) * 100)} %` : "—"} hint={present ? `${present} présente(s)` : undefined} />
      </div>

      {wait.length > 0 && cap > 0 && taken >= cap && <p className="mt-4 rounded-[10px] border border-sky-400/30 bg-sky-400/10 px-4 py-3 font-body text-[13.5px] text-sky-100">Événement complet : {wait.length} personne(s) en liste d&rsquo;attente. Si une place se libère, la première personne est prévenue automatiquement.</p>}

      <Panel className="mt-4" flush title={
        <nav aria-label="Vues" className="flex flex-wrap gap-1">
          {tabs.map(([k, l]) => <Link key={k} href={`/admin/evenements/${id}?vue=${k}`} aria-current={vue === k ? "true" : undefined} className={cn("rounded-[7px] px-3 py-1.5 font-body text-[12.5px] normal-case tracking-normal transition-colors", vue === k ? "bg-white/[0.12] text-white" : "text-mist hover:text-white")}>{l}</Link>)}
        </nav>
      } action={ctx.can("events.attendance") && (
        <div className="flex gap-2">
          <a href={`/admin/export/inscriptions?evenement=${id}&format=csv`} className={btn.small}><Download aria-hidden className="size-3.5" /> CSV</a>
          <a href={`/admin/export/inscriptions?evenement=${id}&format=pdf`} className={btn.small}><Download aria-hidden className="size-3.5" /> PDF</a>
        </div>
      )}>
        {vue === "presences" && can && (
          <div className="grid gap-4 border-b border-line p-5 md:grid-cols-[1fr_auto] md:items-end">
            <form id="checkin-form" action={checkinAction.bind(null, id)} className="flex flex-wrap items-end gap-2">
              <label className="min-w-[240px] flex-1"><span className="font-body text-[12px] text-white/70">Numéro de membre ou code du QR</span><input id="checkin-code" name="code" className={cn(inp, "mt-1.5")} placeholder="DUQQUE120399-LDDP2026" autoComplete="off" /></label>
              <SubmitButton>Pointer la présence</SubmitButton>
            </form>
            <QrScanner inputId="checkin-code" formId="checkin-form" />
          </div>
        )}
        <RegistrationsTable rows={shown} returnTo={returnTo} canEdit={can} canFinance={ctx.can("finance.edit")} showAttendance={vue !== "attente"} showFinance={finance} />
      </Panel>

      {ctx.can("events.edit") && (
        <Panel className="mt-4" title="Publication et suppression">
          <div className="flex flex-wrap gap-2">
            {ev.status !== "published" && <form action={setEventStatusAction.bind(null, id, "published")}><SubmitButton>Publier</SubmitButton></form>}
            {ev.status === "published" && <form action={setEventStatusAction.bind(null, id, "draft")}><SubmitButton variant="outline">Repasser en brouillon</SubmitButton></form>}
            {ev.status !== "archived" && <form action={setEventStatusAction.bind(null, id, "archived")}><SubmitButton variant="outline">Archiver</SubmitButton></form>}
            <form action={deleteEventAction.bind(null, id)}><SubmitButton variant="danger" confirm="Supprimer cet événement ? S'il a des inscriptions, il sera seulement archivé.">Supprimer</SubmitButton></form>
          </div>
        </Panel>
      )}
    </>
  );
}
