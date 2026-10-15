import Link from "next/link";
import { notFound } from "next/navigation";
import { Download, ExternalLink, Pencil } from "lucide-react";
import { QrScanner } from "@/components/admin/QrScanner";
import { RegistrationsTable } from "@/components/admin/RegistrationsTable";
import { SubmitButton } from "@/components/admin/SubmitButton";
import { Badge, Field, Flash, Kpi, PageHeader, Panel, area, btn, inp } from "@/components/admin/ui";
import { eur, fmtDateLong } from "@/lib/admin/format";
import { first, type SP } from "@/lib/admin/params";
import { cn } from "@/lib/cn";
import { requireAdmin } from "@/lib/server/admin-auth";
import { getEventAdmin } from "@/lib/server/events";
import { listAllRegistrations, takenPlaces } from "@/lib/server/store";
import { checkinAction, deleteEventAction, sendEventMailAction, setEventStatusAction, setSalesStateAction } from "../actions";
import { salesNotice, salesOpen } from "@/lib/sales";
import { mapsUrl } from "@/lib/server/tickets";

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
  // Présentes : billet scanné à l'entrée (application de contrôle ou pointage ici) ; absentes : billet valide jamais scanné.
  const withTicket = active.filter((r) => r.status === "paid" || (r.status === "confirmed" && r.amountCents === 0));
  const presentCount = withTicket.filter((r) => r.attended === true).length;
  const tabs = [["inscrites", `Inscrites (${active.length})`], ["attente", `Liste d'attente (${wait.length})`], ["presences", `Présences (${presentCount}/${withTicket.length})`]] as const;
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

      <Panel className="mt-4" title="Tarifs et paiement" action={ctx.can("events.pricing") && ctx.can("events.edit") && <Link href={`/admin/evenements/${id}/modifier`} className="font-body text-[12.5px] text-mist underline underline-offset-4 hover:text-white">Modifier les tarifs</Link>}>
        <dl className="grid gap-x-8 gap-y-3 font-body text-[13.5px] sm:grid-cols-2 lg:grid-cols-4">
          <div><dt className="text-mist">Prix par place</dt><dd className="mt-1 text-white">{ev.registration.paymentMode === "none" || ev.registration.priceCents === 0 ? "Non défini" : eur(ev.registration.priceCents)}</dd></div>
          <div><dt className="text-mist">Tarifs par formule</dt><dd className="mt-1 text-white">{ev.registration.tiers?.length ? ev.registration.tiers.map((t) => `${t.label} : ${eur(t.priceCents)}`).join(" · ") : "Aucun"}</dd></div>
          <div><dt className="text-mist">Mode de paiement</dt><dd className="mt-1 text-white">{{ online: "En ligne, obligatoire", optional: "En ligne, facultatif", onsite: "Sur place", manual: "Manuel (virement, chèque)", none: "Aucun" }[ev.registration.paymentMode ?? "online"]}</dd></div>
          {finance && <div><dt className="text-mist">À encaisser</dt><dd className="mt-1 text-white">{eur(regs.filter((r) => r.status === "awaiting_payment" || (r.status === "confirmed" && r.amountCents > 0)).reduce((n, r) => n + r.amountCents, 0))}</dd></div>}
        </dl>
        {ev.registration.paymentInstructions && <p className="mt-4 font-body text-[12.5px] text-mist">Consignes : {ev.registration.paymentInstructions}</p>}
      </Panel>

      {ev.registration.mode === "form" && (
        <Panel className="mt-4" title="Billetterie">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="font-body text-[14px] text-white">
              {salesOpen(ev.registration) ? <Badge tone="green">Ouverte</Badge> : ev.registration.salesState === "scheduled" ? <Badge tone="blue">Programmée</Badge> : <Badge tone="orange">En attente</Badge>}
              <span className="ml-3 text-mist">{salesOpen(ev.registration) ? `Réservations possibles · ${cap || "sans limite de"} places` : salesNotice(ev.registration).long}</span>
            </p>
            {ctx.can("events.edit") && (
              <div className="flex flex-wrap gap-2">
                {!salesOpen(ev.registration) && <form action={setSalesStateAction.bind(null, id, "open")}><SubmitButton confirm={`Ouvrir la billetterie maintenant (${cap || "sans limite de"} places) ? Les réservations deviennent possibles tout de suite.`}>Ouvrir maintenant</SubmitButton></form>}
                {ev.registration.salesState !== "paused" && <form action={setSalesStateAction.bind(null, id, "paused")}><SubmitButton variant="outline" confirm="Mettre la billetterie en attente ? L'événement reste affiché mais plus personne ne peut réserver (les billets déjà émis restent valables).">Mettre en attente</SubmitButton></form>}
                <Link href={`/admin/evenements/${id}/modifier`} className={btn.outline}>Programmer une date ou changer le nombre de places</Link>
              </div>
            )}
          </div>
        </Panel>
      )}

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
        {vue === "presences" && (
          <p className="border-b border-line px-5 py-3 font-body text-[13.5px] text-white"><strong>{presentCount}</strong> présente{presentCount > 1 ? "s" : ""} · <strong>{withTicket.length - presentCount}</strong> absente{withTicket.length - presentCount > 1 ? "s" : ""} (billet jamais scanné) · mis à jour en direct par l&rsquo;application de contrôle des billets</p>
        )}
        {vue === "presences" && can && (
          <div className="grid gap-4 border-b border-line p-5 md:grid-cols-[1fr_auto] md:items-end">
            <form id="checkin-form" action={checkinAction.bind(null, id)} className="flex flex-wrap items-end gap-2">
              <label className="min-w-[240px] flex-1"><span className="font-body text-[12px] text-white/70">Code-barres du billet, numéro de membre ou QR code de la carte</span><input id="checkin-code" name="code" autoFocus className={cn(inp, "mt-1.5")} placeholder="Scannez le billet (ou saisissez ses 12 chiffres)" autoComplete="off" /></label>
              <SubmitButton>Contrôler / pointer</SubmitButton>
            </form>
            <QrScanner inputId="checkin-code" formId="checkin-form" />
          </div>
        )}
        <RegistrationsTable rows={shown} returnTo={returnTo} canEdit={can} canFinance={ctx.can("finance.edit")} showAttendance={vue !== "attente"} showFinance={finance} />
      </Panel>

      {can && (
        <Panel className="mt-4" title={`E-mail aux participantes (${withTicket.length})`}>
          <p className="mb-4 font-body text-[12.5px] text-mist">Envoyé à chaque participante dont le billet est valide (payé). Le message est pré-rempli avec la date, l&rsquo;heure et le lieu : modifiez-le librement. {"{{prenom}}"} est remplacé par le prénom de chacune.</p>
          <form action={sendEventMailAction.bind(null, id)} className="grid gap-4">
            <Field label="Objet"><input name="subject" required maxLength={160} defaultValue={`Rappel : ${ev.title} le ${fmtDateLong(ev.date)}`} className={inp} /></Field>
            <Field label="Message"><textarea name="body" required rows={9} maxLength={5000} defaultValue={eventMailBody(ev)} className={area} /></Field>
            <label className="flex items-center gap-2 font-body text-[13.5px] text-white/85"><input type="checkbox" name="attachTicket" defaultChecked className="size-4 accent-[#d90f2c]" /> Joindre le billet PDF de chacune</label>
            <div><SubmitButton confirm={`Envoyer cet e-mail à ${withTicket.length} participante(s) ?`}>Envoyer l&rsquo;e-mail à {withTicket.length} participante{withTicket.length > 1 ? "s" : ""}</SubmitButton></div>
          </form>
        </Panel>
      )}

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

/** Message pré-rempli de l'e-mail aux participantes : date, heure, lieu et itinéraire. */
function eventMailBody(ev: { title: string; date: string; time: string; venue: string; address: string; city?: string; gps?: string; mapUrl?: string }) {
  const address = [ev.address, ev.city].filter((x) => x && !/communiqu/i.test(x)).join(", ");
  return [
    "Bonjour {{prenom}},",
    `Petit rappel : « ${ev.title} » a lieu le ${fmtDateLong(ev.date)}${ev.time ? ` à ${ev.time.replace(":", "h")}` : ""}.`,
    `Lieu : ${ev.venue}${address ? `, ${address}` : ""}\nItinéraire : ${mapsUrl(ev)}`,
    "Pensez à présenter votre billet à l'entrée, sur votre téléphone ou imprimé : son code-barres sera scanné.",
    "À très vite !",
  ].join("\n\n");
}
