import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Breakdown, LineChart } from "@/components/admin/charts";
import { Empty, Kpi, Panel } from "@/components/admin/ui";
import { RANGES, eur, fmtDateLong, fmtTime, num, resolveRange } from "@/lib/admin/format";
import { requireAdmin } from "@/lib/server/admin-auth";
import { dashboardData, recentActivity } from "@/lib/server/admin-data";
import { maybeTick } from "@/lib/server/comms";
import { articlesDb } from "@/lib/server/content";
import { getAllEventsAdmin } from "@/lib/server/events";
import { cn } from "@/lib/cn";

export const metadata = { title: "Tableau de bord" };

const dot = { urgent: "bg-psg-red-bright", important: "bg-amber-400", info: "bg-emerald-400" } as const;

function greeting() {
  const h = Number(new Intl.DateTimeFormat("fr-FR", { hour: "numeric", hour12: false, timeZone: "Europe/Paris" }).format(new Date()));
  return h >= 18 || h < 4 ? "Bonsoir" : "Bonjour";
}

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ range?: string }> }) {
  const ctx = await requireAdmin("dashboard.view");
  await maybeTick();
  const { range: rangeKey } = await searchParams;
  const range = resolveRange(rangeKey);
  const [d, activity, events, articles] = await Promise.all([dashboardData(range), recentActivity(10), getAllEventsAdmin(), articlesDb.all()]);
  const finance = ctx.can("finance.view");
  const members = ctx.can("members.view");
  const today = new Date().toISOString().slice(0, 10);
  const upcoming = events.filter((e) => (e.status ?? "published") === "published" && e.date >= today).slice(0, 4);

  const tasks = [
    { n: events.filter((e) => e.status === "draft").length, text: "événement(s) en brouillon à finaliser", href: "/admin/evenements" },
    { n: articles.filter((a) => a.status === "draft").length, text: "article(s) en brouillon", href: "/admin/contenu?statut=draft" },
    { n: articles.filter((a) => a.status === "scheduled").length, text: "publication(s) programmée(s)", href: "/admin/contenu?statut=scheduled" },
    ...(finance ? [{ n: d.pay.pending, text: "paiement(s) à relancer ou valider", href: "/admin/finances/transactions?statut=pending" }] : []),
    ...(members ? [{ n: d.expiring30, text: "adhésion(s) à renouveler ce mois-ci", href: "/admin/adherentes?vue=renouvellements" }] : []),
  ].filter((t) => t.n > 0);

  return (
    <>
      <header className="mb-8">
        <h1 className="font-display text-[clamp(28px,3.4vw,42px)] font-semibold uppercase leading-none tracking-[0.05em] text-white">
          {greeting()}, {ctx.admin.firstName}.
        </h1>
        <p className="mt-2 font-body text-[14.5px] text-mist">Voici l&rsquo;activité des Dames du Parc aujourd&rsquo;hui.</p>
        <p className="mt-1 font-body text-[13px] capitalize text-white/50">{fmtDateLong(new Date().toISOString())}</p>
      </header>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {members && <Kpi label="Membres actives" value={num(d.active)} delta={d.activeDelta} href="/admin/adherentes?statut=active" hint={`sur ${num(d.totalMembers)}`} />}
        {members && <Kpi label="Nouvelles adhésions" value={num(d.newInRange)} delta={d.newDelta} href="/admin/adherentes?vue=nouvelles" hint={`${range.days} derniers jours`} />}
        <Kpi label="Inscriptions événements" value={num(d.registrations)} href="/admin/evenements/inscriptions" hint={`${d.upcoming} événement(s) à venir`} />
        {finance && <Kpi label="Recettes" value={eur(d.revenueRange)} delta={d.revenueDelta} href="/admin/finances" hint={`${range.days} derniers jours`} />}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        {finance && (
          <Panel title="Paiements" action={<Link href="/admin/finances/transactions" className="font-body text-[12.5px] text-mist hover:text-white">Voir tout</Link>}>
            <ul className="space-y-2.5 font-body text-[14px]">
              {[
                ["Payés", d.pay.paid, "paid", "bg-emerald-400"],
                ["En attente", d.pay.pending, "pending", "bg-amber-400"],
                ["Échoués", d.pay.failed, "failed", "bg-psg-red-bright"],
                ["Remboursés", d.pay.refunded, "refunded", "bg-sky-400"],
              ].map(([l, n, s, c]) => (
                <li key={String(s)}>
                  <Link href={`/admin/finances/transactions?statut=${s}`} className="flex items-center justify-between rounded-[6px] px-1 py-0.5 hover:bg-white/[0.04]">
                    <span className="flex items-center gap-2.5 text-white/80"><span aria-hidden className={cn("size-2 rounded-full", String(c))} />{l}</span>
                    <span className="tabular-nums text-white">{n}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </Panel>
        )}
        {members && (
          <Panel title="Adhésions" action={<Link href="/admin/adherentes" className="font-body text-[12.5px] text-mist hover:text-white">Voir tout</Link>}>
            <ul className="space-y-2.5 font-body text-[14px]">
              {[
                ["Nouvelles", d.newInRange, "/admin/adherentes?vue=nouvelles"],
                ["Renouvellements", d.renewals, "/admin/adherentes?vue=renouvellements"],
                ["Expirées", d.expired, "/admin/adherentes?vue=expirees"],
                ["À échéance sous 30 jours", d.expiring30, "/admin/adherentes?vue=renouvellements"],
              ].map(([l, n, h]) => (
                <li key={String(l)}>
                  <Link href={String(h)} className="flex items-center justify-between rounded-[6px] px-1 py-0.5 hover:bg-white/[0.04]">
                    <span className="text-white/80">{l}</span>
                    <span className="tabular-nums text-white">{n}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </Panel>
        )}
        <Panel title="Événements" action={<Link href="/admin/evenements" className="font-body text-[12.5px] text-mist hover:text-white">Voir tout</Link>}>
          <ul className="space-y-2.5 font-body text-[14px]">
            <li className="flex items-center justify-between"><span className="text-white/80">À venir</span><span className="tabular-nums text-white">{d.upcoming}</span></li>
            <li className="flex items-center justify-between"><span className="text-white/80">Places réservées</span><span className="tabular-nums text-white">{d.placesReserved}</span></li>
            <li className="flex items-center justify-between"><span className="text-white/80">Places restantes</span><span className="tabular-nums text-white">{d.placesLeft}</span></li>
          </ul>
        </Panel>
      </div>

      <Panel
        className="mt-4"
        title="Évolution"
        action={
          <div className="flex flex-wrap gap-1">
            {RANGES.map((r) => (
              <Link key={r.key} href={`/admin?range=${r.key}`} aria-current={range.key === r.key ? "true" : undefined} className={cn("rounded-[7px] px-2.5 py-1 font-body text-[12px] transition-colors", range.key === r.key ? "bg-white/[0.12] text-white" : "text-mist hover:text-white")}>
                {r.label}
              </Link>
            ))}
          </div>
        }
      >
        <div className={cn("grid gap-8", finance && members && "lg:grid-cols-2")}>
          {members && (
            <div>
              <p className="mb-3 font-body text-[12.5px] text-mist">Adhésions (cumul des membres)</p>
              <LineChart labels={d.labels} series={[{ label: "Membres", color: "#f01634", values: d.cumulative }]} />
            </div>
          )}
          {finance && (
            <div>
              <p className="mb-3 font-body text-[12.5px] text-mist">Recettes par jour (€)</p>
              <LineChart labels={d.labels} series={[{ label: "Recettes", color: "#5b8bff", values: d.revSeries }]} format={(n) => `${n} €`} />
            </div>
          )}
        </div>
      </Panel>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Panel title="À traiter">
          {d.alerts.length === 0 ? (
            <Empty>Tout est à jour.</Empty>
          ) : (
            <ul className="divide-y divide-white/[0.06]">
              {d.alerts.map((a, i) => (
                <li key={i}>
                  <Link href={a.href} className="group flex items-center gap-3 py-3 hover:bg-white/[0.02]">
                    <span aria-hidden className={cn("size-2.5 shrink-0 rounded-full", dot[a.level])} />
                    <span className="flex-1 font-body text-[14px] text-white/90">{a.text}</span>
                    <ArrowRight aria-hidden className="size-4 text-white/40 transition-transform group-hover:translate-x-1 group-hover:text-white" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>
        <Panel title="Activité récente">
          {activity.length === 0 ? (
            <Empty>Aucune activité pour le moment.</Empty>
          ) : (
            <ol className="space-y-4">
              {activity.map((a, i) => (
                <li key={i} className="flex gap-4">
                  <span className="w-[74px] shrink-0 font-body text-[12px] tabular-nums text-mist">
                    {new Date(a.at).toDateString() === new Date().toDateString() ? fmtTime(a.at) : new Date(a.at).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })}
                  </span>
                  <p className="min-w-0 flex-1 font-body text-[13.5px] leading-snug text-white/85">
                    {a.href ? <Link href={a.href} className="hover:text-white">{a.text}</Link> : a.text}
                    {a.amount !== undefined && finance && <span className="ml-2 font-semibold text-emerald-300">+{eur(a.amount)}</span>}
                  </p>
                </li>
              ))}
            </ol>
          )}
        </Panel>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Panel title="Prochains événements" className="lg:col-span-2">
          {upcoming.length === 0 ? <Empty>Aucun événement à venir.</Empty> : (
            <ul className="divide-y divide-white/[0.06]">
              {upcoming.map((e) => (
                <li key={e.id}>
                  <Link href={`/admin/evenements/${e.id}`} className="flex items-center justify-between gap-4 py-3 hover:bg-white/[0.02]">
                    <span className="min-w-0"><span className="block truncate font-body text-[14px] text-white">{e.title}</span><span className="font-body text-[12.5px] text-mist">{fmtDateLong(e.date)} · {e.venue}</span></span>
                    <span className="shrink-0 font-body text-[12.5px] tabular-nums text-mist">{e.registration.capacity} places</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>
        <Panel title="Tâches à effectuer">
          {tasks.length === 0 ? <Empty>Aucune tâche en attente.</Empty> : (
            <ul className="space-y-3">
              {tasks.map((t) => (
                <li key={t.text}><Link href={t.href} className="flex items-baseline gap-2 font-body text-[13.5px] text-white/85 hover:text-white"><span className="font-display text-[20px] font-semibold tabular-nums text-white">{t.n}</span>{t.text}</Link></li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
      {finance && members && (
        <Panel className="mt-4" title="Répartition des paiements">
          <Breakdown rows={[{ label: "Payés", value: d.pay.paid, color: "#34d399" }, { label: "En attente", value: d.pay.pending, color: "#fbbf24" }, { label: "Échoués", value: d.pay.failed, color: "#f01634" }, { label: "Remboursés", value: d.pay.refunded, color: "#38bdf8" }]} />
        </Panel>
      )}
    </>
  );
}
