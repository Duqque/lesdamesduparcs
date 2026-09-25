import Image from "next/image";
import { Calendar, Clock, MapPin, Trophy } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { CardLabel } from "@/components/ui/CardLabel";
import { formatLongDate, formatTime } from "@/lib/format";
import type { Match } from "@/types";

export function MatchCard({ match }: { match: Match }) {
  return (
    <article
      data-cursor="view"
      aria-label="Prochain match"
      className="group relative isolate flex min-h-[380px] flex-col overflow-hidden rounded-[8px] border border-line bg-night-900 p-6 shadow-[0_24px_60px_-34px_rgba(0,0,0,0.95)] w-full xl:min-h-[320px]"
    >
      <div aria-hidden className="absolute inset-0 -z-10 overflow-hidden">
        <Image
          src={match.image}
          alt=""
          fill
          sizes="(min-width: 1280px) 34vw, 100vw"
          className="object-cover object-[85%_30%] transition-transform duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.03] md:object-[80%_40%]"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(3,9,25,0.96)_0%,rgba(3,9,25,0.82)_38%,rgba(3,9,25,0.35)_78%,rgba(3,9,25,0.15)_100%)] transition-opacity duration-500 group-hover:opacity-90" />
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-night-950/80 to-transparent" />
      </div>

      <div className="flex items-center justify-between gap-3">
        <CardLabel icon={Trophy}>Prochain match</CardLabel>
        <span className="hidden font-body text-[10.5px] font-semibold uppercase tracking-[0.14em] text-mist sm:block">{match.competition}</span>
      </div>

      <div className="mt-6 flex items-center gap-5">
        <Image src={match.homeLogo} alt={match.homeTeam} width={66} height={66} className="size-[62px] object-contain md:size-[66px]" />
        <span aria-hidden className="font-display text-[19px] font-bold uppercase tracking-[0.08em] text-white">
          vs
        </span>
        <Image src={match.awayLogo} alt={match.awayTeam} width={66} height={66} className="size-[58px] object-contain md:size-[62px]" />
      </div>

      <ul className="mt-7 space-y-3 font-body text-[13px] text-white/90">
        <li className="flex items-center gap-2.5">
          <Calendar aria-hidden className="size-[15px] shrink-0 text-white/80" strokeWidth={1.8} />
          <time dateTime={match.date}>{formatLongDate(match.date)}</time>
        </li>
        <li className="flex items-center gap-2.5">
          <Clock aria-hidden className="size-[15px] shrink-0 text-white/80" strokeWidth={1.8} />
          <time dateTime={match.time}>{formatTime(match.time)}</time>
        </li>
        <li className="flex items-center gap-2.5">
          <MapPin aria-hidden className="size-[15px] shrink-0 text-white/80" strokeWidth={1.8} />
          {match.stadium}
        </li>
      </ul>

      <div className="mt-auto pt-7">
        <Button variant="outline" size="sm" href={match.ticketHref}>
          Je réserve ma place
        </Button>
      </div>
    </article>
  );
}
