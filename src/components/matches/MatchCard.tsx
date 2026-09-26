import Image from "next/image";
import { Calendar, Clock, MapPin, Trophy, UsersRound } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { CardLabel } from "@/components/ui/CardLabel";
import { formatLongDate, formatTime } from "@/lib/format";
import { MatchLogo } from "./MatchLogo";
import type { MatchView } from "@/lib/server/matches";

/** Prochain match du PSG (accueil) : logos carrés domicile / extérieur / compétition, billetterie officielle, match vécu avec les Dames, adhésion. */
export function MatchCard({ match }: { match: MatchView }) {
  return (
    <article
      data-cursor="view"
      aria-label="Prochain match"
      className="group relative isolate flex min-h-[380px] w-full flex-col overflow-hidden rounded-[8px] border border-line bg-night-900 p-6 shadow-[0_24px_60px_-34px_rgba(0,0,0,0.95)] xl:min-h-[320px]"
    >
      <div aria-hidden className="absolute inset-0 -z-10 overflow-hidden">
        <Image
          src={match.image}
          alt=""
          fill
          sizes="(min-width: 1280px) 34vw, 100vw"
          className="object-cover object-[85%_30%] transition-transform duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.03] md:object-[80%_40%]"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(3,9,25,0.96)_0%,rgba(3,9,25,0.86)_42%,rgba(3,9,25,0.45)_80%,rgba(3,9,25,0.25)_100%)] transition-opacity duration-500 group-hover:opacity-90" />
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-night-950/80 to-transparent" />
      </div>

      <div className="flex items-center justify-between gap-3">
        <CardLabel icon={Trophy}>Prochain match</CardLabel>
        <span className="hidden font-body text-[10.5px] font-semibold uppercase tracking-[0.14em] text-mist sm:block">{match.competition}</span>
      </div>

      <div className="mt-6 flex items-center gap-4 md:gap-5">
        <MatchLogo src={match.homeLogo} name={match.homeTeam} className="size-[64px] md:size-[72px]" />
        <span aria-hidden className="font-display text-[16px] uppercase text-white">vs</span>
        <MatchLogo src={match.awayLogo} name={match.awayTeam} className="size-[64px] md:size-[72px]" />
        {(match.competitionLogo || match.competition) && (
          <>
            <span aria-hidden className="mx-1 h-12 w-px bg-white/20" />
            <MatchLogo src={match.competitionLogo} name={match.competition || "Compétition"} className="size-[48px] md:size-[56px]" />
          </>
        )}
      </div>

      <ul className="mt-7 space-y-3 font-body text-[13px] text-white/90">
        <li className="flex items-center gap-2.5">
          <Calendar aria-hidden className="size-[15px] shrink-0 text-white/80" strokeWidth={1.8} />
          <time dateTime={match.date}>{formatLongDate(match.date)}</time>
        </li>
        <li className="flex items-center gap-2.5">
          <Clock aria-hidden className="size-[15px] shrink-0 text-white/80" strokeWidth={1.8} />
          {match.time ? <time dateTime={match.time}>{formatTime(match.time)}</time> : <span>Horaire à confirmer</span>}
        </li>
        {match.stadium && (
          <li className="flex items-center gap-2.5">
            <MapPin aria-hidden className="size-[15px] shrink-0 text-white/80" strokeWidth={1.8} />
            {match.stadium}
          </li>
        )}
      </ul>

      <div className="mt-auto flex flex-wrap gap-3 pt-7">
        <Button variant="outline" size="sm" href={match.ticketHref} external>
          Billetterie officielle
        </Button>
        {match.related && (
          <Button size="sm" href={`/evenements/${match.related.id}`} icon={UsersRound} arrow={false}>
            Vivre le match avec les Dames !
          </Button>
        )}
      </div>
      <p className="mt-4 font-body text-[13px] text-white/75">
        Pas encore membre ? <a href="/rejoindre-le-groupe/inscription" className="font-medium text-white underline decoration-psg-red-bright decoration-2 underline-offset-[5px] hover:decoration-white">Adhérer aux Dames du Parc</a>
      </p>
    </article>
  );
}
