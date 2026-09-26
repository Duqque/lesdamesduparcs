import Image from "next/image";
import Link from "next/link";
import { formatDay, formatMonthShort, formatTime } from "@/lib/format";
import { cn } from "@/lib/cn";
import { MatchLogo } from "./MatchLogo";
import { Tone } from "@/components/news/NewsCard";
import type { MatchView } from "@/lib/server/matches";
import { JoinGate } from "@/components/member/JoinGate";

/**
 * Match du PSG présenté comme un événement spécial du calendrier, à la même taille et sur le même gabarit que les cartes
 * d'événements (bloc de texte, photo, barre de deux boutons). « Prochain match » pour le premier à venir.
 */
export function MatchEventCard({ match, next, className }: { match: MatchView; next?: boolean; className?: string }) {
  const title = match.isHome ? `PSG – ${match.opponent}` : `${match.opponent} – PSG`;
  return (
    <article
      aria-label={`${next ? "Prochain match" : "Match du PSG"} : ${title}`}
      className={cn("group flex h-full w-[min(78vw,290px)] shrink-0 snap-start flex-col overflow-hidden rounded-[4px] border border-psg-red-bright/40 bg-[#0b1327] text-white md:w-auto", className)}
    >
      <div className="flex flex-col px-[clamp(16px,1.6vw,24px)] pb-5 pt-6">
        <p className="flex items-center justify-between gap-2 font-body text-[12px] font-bold uppercase tracking-[0.12em]">
          <span className={next ? "text-psg-red-bright" : "text-mist"}>{next ? "Prochain match" : "Match du PSG"}</span>
          {match.competition && <span className="min-w-0 truncate text-mist">{match.competition}</span>}
        </p>
        {/* Trois logos carrés : domicile, extérieur, compétition */}
        <div className="mt-4 flex items-center gap-2.5">
          <MatchLogo src={match.homeLogo} name={match.homeTeam} className="size-[46px]" />
          <span aria-hidden className="font-display text-[12px] uppercase text-white/75">vs</span>
          <MatchLogo src={match.awayLogo} name={match.awayTeam} className="size-[46px]" />
          {(match.competitionLogo || match.competition) && <MatchLogo src={match.competitionLogo} name={match.competition || "Compétition"} className="ml-auto size-[34px]" />}
        </div>
        <h3 className="mt-4 min-h-[2.9em] break-words font-body text-[13.5px] font-medium leading-[1.45] text-white/90">{title}</h3>
        <p className="mt-2 flex items-end gap-2.5">
          <span aria-hidden className="font-display text-[clamp(44px,4.4vw,64px)] font-medium leading-[0.85] tabular-nums">{formatDay(match.date).replace(/^0/, "")}</span>
          <span aria-hidden className="whitespace-nowrap pb-1 font-body text-[clamp(14px,1.2vw,17px)] font-medium capitalize leading-none text-white/85">{formatMonthShort(match.date).toLowerCase()}</span>
          <time className="sr-only" dateTime={match.date}>{match.date}</time>
        </p>
        <p className="mt-3 truncate font-body text-[12.5px] text-white/75">
          {match.time ? formatTime(match.time) : "Horaire à confirmer"}
          {match.stadium ? ` · ${match.stadium}` : ""}
        </p>
      </div>
      <div className="relative min-h-[101px] flex-1 overflow-hidden bg-night-900">
        <Image src={match.image} alt="" fill sizes="(min-width: 1024px) 22vw, (min-width: 768px) 45vw, 78vw" className="object-cover saturate-[0.8] transition-transform duration-[1200ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.06]" />
        <Tone />
      </div>
      <div className="grid grid-flow-col auto-cols-fr divide-x divide-white/15 border-t border-white/15 bg-night-900 font-body text-[13px] text-white">
        <a href={match.ticketHref} target="_blank" rel="noopener noreferrer" className="grid min-h-11 place-items-center px-3 text-center transition-colors hover:bg-white/10">Billetterie</a>
        {match.related ? (
          <Link href={`/evenements/${match.related.id}`} className="grid min-h-11 place-items-center bg-psg-red px-2 text-center text-[12.5px] font-medium leading-tight transition-colors hover:bg-psg-red-bright">Vivre le match avec les Dames !</Link>
        ) : (
          <JoinGate><Link href="/rejoindre-le-groupe/inscription" className="grid min-h-11 place-items-center px-2 text-center leading-tight transition-colors hover:bg-white/10">Adhérer aux Dames</Link></JoinGate>
        )}
      </div>
    </article>
  );
}
