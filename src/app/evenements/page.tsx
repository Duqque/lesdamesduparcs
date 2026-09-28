import { JoinGate, JoinSectionGate, JoinText } from "@/components/member/JoinGate";
import type { Metadata } from "next";
import { getCms } from "@/lib/server/cms";
import { seoFor } from "@/lib/server/site";
import Link from "next/link";
import { Download } from "lucide-react";
import { EventGridCard } from "@/components/events/EventGridCard";
import { PastEvents } from "@/components/events/PastEvents";
import { getPublishedEvents } from "@/lib/server/events";
import { isPast } from "@/data/events";
import { MatchWithEventCard } from "@/components/matches/MatchWithEventCard";
import { MatchEventCard } from "@/components/matches/MatchEventCard";
import { getUpcomingMatchViews } from "@/lib/server/matches";
import { Button } from "@/components/ui/Button";
import { formatCompactDate as formatShortDate } from "@/lib/format";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  return seoFor("/evenements", { title: "Événements", description: "Les événements des Dames du Parc : matchs, soirées, ateliers, rencontres et déplacements, à venir et passés." });
}

export default async function EventsPage() {
  const [all, matches, cms] = await Promise.all([getPublishedEvents(), getUpcomingMatchViews(60), getCms()]);
  const upcoming = all.filter((e) => !isPast(e)).sort((a, b) => a.date.localeCompare(b.date));
  // Les événements des Dames priment : en haut, seul le prochain match du PSG accompagne les événements (par date) ; tous les autres sont en fin de page.
  const [nextMatch, ...otherMatches] = matches;
  // Le prochain match est TOUJOURS en premier. Si un événement des Dames lui est relié le même jour, les deux ne forment qu'une seule carte.
  const linked = nextMatch?.related ? upcoming.find((e) => e.id === nextMatch.related!.id && e.date === nextMatch.date) : undefined;
  const timeline: Array<{ kind: "event"; event: (typeof upcoming)[number] } | { kind: "match"; match: NonNullable<typeof nextMatch> } | { kind: "merged"; match: NonNullable<typeof nextMatch>; event: (typeof upcoming)[number] }> = [
    ...(nextMatch ? [linked ? { kind: "merged" as const, match: nextMatch, event: linked } : { kind: "match" as const, match: nextMatch }] : []),
    ...upcoming.filter((e) => e !== linked).map((e) => ({ kind: "event" as const, event: e })),
  ];
  const past = all.filter((e) => isPast(e)).sort((a, b) => b.date.localeCompare(a.date));

  return (
    <main className="relative overflow-x-clip pb-40 pt-[190px] md:pt-[240px]">
      <div className="mx-auto max-w-[1300px] px-[var(--gutter)]">
        <div className="relative">

          <nav aria-label="Fil d'Ariane" className="font-body text-[13px] text-mist">
            <Link href="/" className="hover:text-white">Accueil</Link> / <span className="text-white/80">Événements</span>
          </nav>
          <h1 className="mt-10 md:mt-16 t-display">{cms.t("evenements.titre", "Événements")}</h1>
          <p className="mt-8 max-w-md text-white/75 t-lead">
            {cms.t("evenements.intro", "Matchs au Parc, soirées, ateliers et déplacements : les rendez-vous des Dames du Parc se succèdent tout au long de la saison.")}
          </p>
          <Link href="/evenements/calendrier.ics" prefetch={false} className="mt-6 inline-flex min-h-11 items-center gap-2 font-body text-[13px] font-medium text-white/80 hover:text-white">
            <Download aria-hidden className="size-4" strokeWidth={1.8} /> Ajouter à mon agenda
          </Link>
        </div>

        <JoinSectionGate>
        <aside aria-label="Adhérer" className="mt-16 flex flex-col items-start gap-5 rounded-[10px] border border-psg-red-bright/40 bg-[linear-gradient(90deg,rgba(217,15,44,0.16),rgba(217,15,44,0.03))] p-6 sm:flex-row sm:items-center sm:justify-between md:p-8">
          <p className="max-w-xl font-body text-[16px] leading-[1.6] text-white"><JoinText guest="Vivez les matchs et les événements avec Les Dames du Parc : rejoignez la communauté 100 % féminine de supportrices du Paris Saint-Germain." renew="Votre adhésion est terminée : renouvelez-la pour continuer à vivre les matchs et les événements avec Les Dames du Parc." pay="Il ne reste qu’à régler votre adhésion pour vivre les matchs et les événements avec Les Dames du Parc." /></p>
          <JoinGate><Button size="sm" href="/rejoindre-le-groupe/inscription">Adhérer aux Dames du Parc</Button></JoinGate>
        </aside>
        </JoinSectionGate>

        <section aria-labelledby="upcoming" className="mt-24 md:mt-32">
          <h2 id="upcoming" className="font-body text-[20px] font-medium text-white">{cms.t("evenements.prochains", "Prochains événements")}</h2>
          <ul className="mt-10 -mx-[var(--gutter)] flex snap-x gap-4 overflow-x-auto px-[var(--gutter)] pb-4 [scrollbar-width:none] md:mx-0 md:grid md:grid-cols-2 md:gap-6 md:overflow-visible md:px-0 lg:grid-cols-4 [&::-webkit-scrollbar]:hidden">
            {timeline.map((it) => (
              <li key={it.kind === "event" ? it.event.id : `${it.kind}-${it.match.id}`} className={it.kind === "merged" ? "contents md:col-span-2 md:block lg:col-span-2" : "contents md:block"}>
                {it.kind === "event" ? <EventGridCard event={it.event} /> : it.kind === "merged" ? <MatchWithEventCard match={it.match} event={it.event} /> : <MatchEventCard match={it.match} next />}
              </li>
            ))}
          </ul>
        </section>

        {past.length > 0 && (
          <section aria-labelledby="past" className="mt-28 md:mt-40">
            <h2 id="past" className="font-body text-[20px] font-medium text-white">Événements passés</h2>
            <div className="mt-10">
              <PastEvents events={past} />
            </div>
          </section>
        )}

        {otherMatches.length > 0 && (
          <section aria-labelledby="matchs" className="mt-28 md:mt-40">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="t-eyebrow">Paris Saint-Germain</p>
                <h2 id="matchs" className="mt-3 font-body text-[20px] font-medium text-white">Prochains matchs du PSG</h2>
              </div>
              <Link href="/evenements/calendrier.ics" prefetch={false} className="inline-flex min-h-11 items-center gap-2 font-body text-[13px] font-medium text-white/80 hover:text-white">
                <Download aria-hidden className="size-4" strokeWidth={1.8} /> Ajouter les matchs à mon agenda
              </Link>
            </div>
            <ul className="mt-10 -mx-[var(--gutter)] flex snap-x gap-4 overflow-x-auto px-[var(--gutter)] pb-4 [scrollbar-width:none] md:mx-0 md:grid md:grid-cols-2 md:gap-6 md:overflow-visible md:px-0 lg:grid-cols-4 [&::-webkit-scrollbar]:hidden">
              {otherMatches.slice(0, 4).map((m) => (
                <li key={m.id} className="contents md:block">
                  <MatchEventCard match={m} />
                </li>
              ))}
            </ul>
            {otherMatches.length > 4 && (
              <details className="group mt-6 rounded-[8px] border border-line bg-night-900/60">
                <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between px-5 font-body text-[14px] font-medium text-white [&::-webkit-details-marker]:hidden">
                  Tout le calendrier ({otherMatches.length - 4} autres matchs)
                  <span aria-hidden className="text-mist transition-transform duration-300 group-open:rotate-180">⌄</span>
                </summary>
                <ul className="divide-y divide-white/10 border-t border-white/10">
                  {otherMatches.slice(4).map((m) => (
                    <li key={m.id} className="grid grid-cols-[auto_1fr] items-center gap-x-4 gap-y-2 px-5 py-3 sm:grid-cols-[150px_1fr_auto]">
                      <time dateTime={m.date} className="font-body text-[13px] tabular-nums text-white/80">{formatShortDate(m.date)}{m.time ? ` · ${m.time.replace(":", "h")}` : ""}</time>
                      <span className="min-w-0 font-body text-[14px] text-white">
                        <span className="font-medium">{m.isHome ? `PSG – ${m.opponent}` : `${m.opponent} – PSG`}</span>
                        {m.competition && <span className="ml-2 text-[12px] text-mist">{m.competition}</span>}
                      </span>
                      <span className="col-span-2 flex flex-wrap items-center gap-3 sm:col-span-1 sm:justify-end">
                        {m.related && <Link href={`/evenements/${m.related.id}`} className="font-body text-[12.5px] font-medium text-psg-red-bright underline underline-offset-4">Vivre le match avec les Dames</Link>}
                        <a href={m.ticketHref} target="_blank" rel="noopener noreferrer" className="font-body text-[12.5px] text-white/75 underline underline-offset-4 hover:text-white">Billetterie</a>
                      </span>
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
