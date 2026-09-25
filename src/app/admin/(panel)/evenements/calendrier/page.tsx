import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { PageHeader, Panel } from "@/components/admin/ui";
import { addDays } from "@/lib/admin/format";
import { first, href, type SP } from "@/lib/admin/params";
import { cn } from "@/lib/cn";
import { requireAdmin } from "@/lib/server/admin-auth";
import { calendarItems, type CalItem } from "@/lib/server/admin-data";

export const metadata = { title: "Calendrier" };

const COLORS = { event: "bg-violet-500/25 text-violet-200 border-violet-400/30", post: "bg-sky-500/20 text-sky-200 border-sky-400/30", campaign: "bg-emerald-500/20 text-emerald-200 border-emerald-400/30", expiry: "bg-amber-500/20 text-amber-200 border-amber-400/30" } as const;
const LEGEND = [["event", "Événements"], ["post", "Publications"], ["campaign", "Campagnes"], ["expiry", "Échéances d'adhésion"]] as const;
const VUES = [["mois", "Mois"], ["semaine", "Semaine"], ["jour", "Jour"], ["liste", "Liste"]] as const;

const iso = (d: Date) => d.toISOString().slice(0, 10);

function Chip({ it }: { it: CalItem }) {
  const cls = cn("block truncate rounded-[5px] border px-1.5 py-0.5 font-body text-[11.5px] leading-tight", COLORS[it.kind]);
  return it.href ? <Link href={it.href} className={cls} title={it.label}>{it.label}</Link> : <span className={cls}>{it.label}</span>;
}

/** Calendrier administratif : événements, publications, campagnes et échéances d'adhésion. */
export default async function CalendarPage({ searchParams }: { searchParams: Promise<SP> }) {
  await requireAdmin("events.view");
  const sp = await searchParams;
  const vue = (VUES.find(([k]) => k === first(sp.vue))?.[0] ?? "mois") as (typeof VUES)[number][0];
  const anchor = new Date(`${first(sp.d) ?? iso(new Date())}T12:00:00Z`);
  const items = await calendarItems();
  const at = (day: string) => items.filter((i) => i.date === day);

  const step = vue === "mois" ? 0 : vue === "semaine" ? 7 : 1;
  const prev = vue === "mois" ? new Date(Date.UTC(anchor.getUTCFullYear(), anchor.getUTCMonth() - 1, 1, 12)) : addDays(anchor, -step);
  const next = vue === "mois" ? new Date(Date.UTC(anchor.getUTCFullYear(), anchor.getUTCMonth() + 1, 1, 12)) : addDays(anchor, step);
  const title = anchor.toLocaleDateString("fr-FR", vue === "mois" ? { month: "long", year: "numeric" } : { day: "numeric", month: "long", year: "numeric" });

  let body;
  if (vue === "mois") {
    const first1 = new Date(Date.UTC(anchor.getUTCFullYear(), anchor.getUTCMonth(), 1, 12));
    const start = addDays(first1, -((first1.getUTCDay() + 6) % 7));
    const days = Array.from({ length: 42 }, (_, i) => addDays(start, i));
    body = (
      <div className="overflow-x-auto">
        <div className="grid min-w-[760px] grid-cols-7 border-l border-t border-line">
          {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((d) => <div key={d} className="border-b border-r border-line px-2 py-2 font-body text-[11.5px] font-semibold uppercase tracking-[0.12em] text-mist">{d}</div>)}
          {days.map((d) => {
            const day = at(iso(d));
            const out = d.getUTCMonth() !== anchor.getUTCMonth();
            return (
              <div key={iso(d)} className={cn("min-h-[104px] space-y-1 border-b border-r border-line p-1.5", out && "bg-black/20 opacity-60", iso(d) === iso(new Date()) && "bg-psg-red/[0.07]")}>
                <Link href={href("/admin/evenements/calendrier", { vue: "jour", d: iso(d) })} className="font-body text-[12px] tabular-nums text-white/70 hover:text-white">{d.getUTCDate()}</Link>
                {day.slice(0, 3).map((it, i) => <Chip key={i} it={it} />)}
                {day.length > 3 && <Link href={href("/admin/evenements/calendrier", { vue: "jour", d: iso(d) })} className="block font-body text-[11px] text-mist hover:text-white">+{day.length - 3} autre(s)</Link>}
              </div>
            );
          })}
        </div>
      </div>
    );
  } else if (vue === "semaine") {
    const start = addDays(anchor, -((anchor.getUTCDay() + 6) % 7));
    body = (
      <div className="grid gap-px sm:grid-cols-7">
        {Array.from({ length: 7 }, (_, i) => addDays(start, i)).map((d) => (
          <div key={iso(d)} className="min-h-[160px] space-y-1.5 border border-line p-2">
            <p className="font-body text-[12px] capitalize text-mist">{d.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric" })}</p>
            {at(iso(d)).map((it, i) => <Chip key={i} it={it} />)}
          </div>
        ))}
      </div>
    );
  } else if (vue === "jour") {
    body = <ul className="space-y-2 p-1">{at(iso(anchor)).length === 0 ? <li className="py-8 text-center font-body text-mist">Rien de prévu ce jour.</li> : at(iso(anchor)).map((it, i) => <li key={i}><Chip it={it} /></li>)}</ul>;
  } else {
    const upcoming = items.filter((i) => i.date >= iso(new Date())).slice(0, 80);
    body = (
      <ul className="divide-y divide-white/[0.06]">
        {upcoming.length === 0 && <li className="py-8 text-center font-body text-mist">Rien à venir.</li>}
        {upcoming.map((it, i) => <li key={i} className="flex items-center gap-4 py-2.5"><span className="w-[92px] shrink-0 font-body text-[12.5px] tabular-nums text-mist">{new Date(`${it.date}T12:00:00Z`).toLocaleDateString("fr-FR", { weekday: "short", day: "2-digit", month: "short" })}</span><div className="min-w-0 flex-1"><Chip it={it} /></div></li>)}
      </ul>
    );
  }

  return (
    <>
      <PageHeader title="Calendrier" subtitle={<span className="flex flex-wrap gap-3">{LEGEND.map(([k, l]) => <span key={k} className="flex items-center gap-2"><span aria-hidden className={cn("size-2.5 rounded-sm border", COLORS[k])} />{l}</span>)}</span>} />
      <Panel
        title={<span className="capitalize">{vue === "liste" ? "À venir" : title}</span>}
        action={
          <div className="flex flex-wrap items-center gap-2">
            {vue !== "liste" && (
              <>
                <Link href={href("/admin/evenements/calendrier", { vue, d: iso(prev) })} aria-label="Précédent" className="grid size-8 place-items-center rounded-[7px] border border-line text-white/80 hover:border-white/30"><ChevronLeft aria-hidden className="size-4" /></Link>
                <Link href={href("/admin/evenements/calendrier", { vue })} className="rounded-[7px] border border-line px-3 py-1.5 font-body text-[12.5px] text-white/80 hover:border-white/30">Aujourd&rsquo;hui</Link>
                <Link href={href("/admin/evenements/calendrier", { vue, d: iso(next) })} aria-label="Suivant" className="grid size-8 place-items-center rounded-[7px] border border-line text-white/80 hover:border-white/30"><ChevronRight aria-hidden className="size-4" /></Link>
              </>
            )}
            <span className="ml-2 flex gap-1">{VUES.map(([k, l]) => <Link key={k} href={href("/admin/evenements/calendrier", { vue: k, d: first(sp.d) })} aria-current={vue === k ? "true" : undefined} className={cn("rounded-[7px] px-2.5 py-1 font-body text-[12px] normal-case tracking-normal", vue === k ? "bg-white/[0.12] text-white" : "text-mist hover:text-white")}>{l}</Link>)}</span>
          </div>
        }
      >
        {body}
      </Panel>
    </>
  );
}
