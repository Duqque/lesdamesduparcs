import { JoinGate, JoinSectionGate, JoinText } from "@/components/member/JoinGate";
import type { Metadata } from "next";
import { getCms } from "@/lib/server/cms";
import { seoFor } from "@/lib/server/site";
import Link from "next/link";
import { Download } from "lucide-react";
import { toEventCard } from "@/components/events/EventGridCard";
import { EventGridCard, MatchEventCard } from "@/components/events/ClientCards";
import { PastEvents } from "@/components/events/PastEvents";
import { StackList } from "@/components/events/StackList";
import { getPublishedEvents } from "@/lib/server/events";
import { isPast } from "@/data/events";
import { MatchWithEventCard } from "@/components/matches/MatchWithEventCard";
import { MatchCalendarList } from "@/components/matches/MatchCalendarList";
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
          <div className="mt-10">
            <StackList
              items={timeline.map((it) => ({
                key: it.kind === "event" ? it.event.id : `${it.kind}-${it.match.id}`,
                className: it.kind === "merged" ? "md:col-span-2 lg:col-span-2" : undefined,
                node: it.kind === "event" ? <EventGridCard event={toEventCard(it.event)} /> : it.kind === "merged" ? <MatchWithEventCard match={it.match} event={it.event} /> : <MatchEventCard match={it.match} next />,
              }))}
            />
          </div>
        </section>

        {past.length > 0 && (
          <section aria-labelledby="past" className="mt-28 md:mt-40">
            <h2 id="past" className="font-body text-[20px] font-medium text-white">Événements passés</h2>
            <div className="mt-10">
              <PastEvents events={past.map(toEventCard)} />
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
            <div className="mt-10">
              <StackList items={otherMatches.slice(0, 4).map((m) => ({ key: m.id, node: <MatchEventCard match={m} /> }))} />
            </div>
            {otherMatches.length > 4 && (
              <MatchCalendarList
                rows={otherMatches.slice(4).map((m) => ({
                  id: m.id,
                  date: m.date,
                  label: `${formatShortDate(m.date)}${m.time ? ` · ${m.time.replace(":", "h")}` : ""}`,
                  title: m.isHome ? `PSG – ${m.opponent}` : `${m.opponent} – PSG`,
                  ...(m.competition ? { competition: m.competition } : {}),
                  ...(m.related ? { relatedId: m.related.id } : {}),
                  ticketHref: m.ticketHref,
                }))}
              />
            )}
          </section>
        )}
      </div>
    </main>
  );
}
