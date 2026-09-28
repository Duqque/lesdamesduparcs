import Image from "next/image";
import Link from "next/link";
import { formatDay, formatMonthShort, formatTime } from "@/lib/format";
import { MatchLogo } from "./MatchLogo";
import { Tone } from "@/components/news/NewsCard";
import type { MatchView } from "@/lib/server/matches";
import type { ClubEvent } from "@/types";

/**
 * Le prochain match du PSG ET l'événement des Dames du Parc qui l'accompagne le même jour : une seule carte « divisée »
 * (à gauche le match, à droite l'événement), avec tous les liens utiles : billetterie officielle, inscription, plus d'infos.
 */
export function MatchWithEventCard({ match, event }: { match: MatchView; event: ClubEvent }) {
  const title = match.isHome ? `PSG – ${match.opponent}` : `${match.opponent} – PSG`;
  const href = `/evenements/${event.id}`;
  const open = event.registration.mode !== "closed";
  return (
    <article aria-label={`Prochain match : ${title}, avec l’événement ${event.title}`} className="group flex h-full w-[min(88vw,340px)] shrink-0 snap-start flex-col overflow-hidden rounded-[4px] border border-psg-red-bright/40 bg-[#0b1327] text-white md:col-span-2 md:w-auto">
      <div className="grid flex-1 md:grid-cols-2">
        {/* Moitié match */}
        <div className="flex flex-col px-[clamp(16px,1.6vw,24px)] pb-5 pt-6">
          <p className="flex items-center justify-between gap-2 font-body text-[12px] font-bold uppercase tracking-[0.12em]">
            <span className="text-psg-red-bright">Prochain match</span>
            {match.competition && <span className="min-w-0 truncate text-mist">{match.competition}</span>}
          </p>
          <div className="mt-4 flex items-center gap-2.5">
            <MatchLogo src={match.homeLogo} name={match.homeTeam} className="size-[46px]" />
            <span aria-hidden className="font-display text-[12px] uppercase text-white/75">vs</span>
            <MatchLogo src={match.awayLogo} name={match.awayTeam} className="size-[46px]" />
            {(match.competitionLogo || match.competition) && <MatchLogo src={match.competitionLogo} name={match.competition || "Compétition"} className="ml-auto size-[34px]" />}
          </div>
          <h3 className="mt-4 break-words font-body text-[15px] font-medium leading-[1.4] text-white">{title}</h3>
          <p className="mt-2 flex items-end gap-2.5">
            <span aria-hidden className="font-display text-[clamp(44px,4.4vw,64px)] font-medium leading-[0.85] tabular-nums">{formatDay(match.date).replace(/^0/, "")}</span>
            <span aria-hidden className="whitespace-nowrap pb-1 font-body text-[clamp(14px,1.2vw,17px)] font-medium capitalize leading-none text-white/85">{formatMonthShort(match.date).toLowerCase()}</span>
            <time className="sr-only" dateTime={match.date}>{match.date}</time>
          </p>
          <p className="mt-3 font-body text-[12.5px] text-white/75">
            {match.time ? formatTime(match.time) : "Horaire à confirmer"}
            {match.stadium ? ` · ${match.stadium}` : ""}
          </p>
        </div>

        {/* Moitié événement des Dames */}
        <div className="flex flex-col bg-[#f3f0e8] text-[#0b1a3f]">
          <div className="relative aspect-[16/8] overflow-hidden bg-night-900">
            <Image src={event.image} alt={event.imageAlt} fill sizes="(min-width: 768px) 22vw, 88vw" className="object-cover saturate-[0.85] transition-transform duration-[1200ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.06]" />
            <Tone />
          </div>
          <div className="flex flex-1 flex-col px-[clamp(16px,1.6vw,24px)] pb-5 pt-4">
            <p className="font-body text-[12px] font-bold uppercase tracking-[0.12em] text-[#c8102e]">Avec les Dames du Parc</p>
            <h3 className="mt-2 break-words font-body text-[15px] font-medium leading-[1.4] text-[#0b1a3f]">{event.title}</h3>
            {event.summary && <p className="mt-2 font-body text-[13px] leading-[1.55] text-[#0b1a3f]/75">{event.summary}</p>}
            <p className="mt-auto pt-3 font-body text-[12.5px] text-[#0b1a3f]/70">{event.time ? `${formatTime(event.time)} · ` : ""}{event.venue}</p>
          </div>
        </div>
      </div>

      {/* Tous les liens importants */}
      <div className="grid grid-cols-1 divide-y divide-white/15 border-t border-white/15 bg-night-900 font-body text-[13px] text-white sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        <a href={match.ticketHref} target="_blank" rel="noopener noreferrer" className="grid min-h-11 place-items-center px-3 text-center transition-colors hover:bg-white/10">Billetterie officielle</a>
        {open ? (
          <Link href={event.registration.mode === "external" ? event.href : `${href}#inscription`} className="grid min-h-11 place-items-center bg-psg-red px-3 text-center font-medium leading-tight transition-colors hover:bg-psg-red-bright">Vivre le match avec les Dames !</Link>
        ) : (
          <span className="grid min-h-11 place-items-center px-3 text-center text-white/60">Inscriptions terminées</span>
        )}
        <Link href={href} className="grid min-h-11 place-items-center px-3 text-center transition-colors hover:bg-white/10">Plus d&rsquo;infos</Link>
      </div>
    </article>
  );
}
