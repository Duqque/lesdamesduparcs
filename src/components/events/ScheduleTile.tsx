import Link from "next/link";
import { Bus, Medal, Mic, Sparkles, Star, Trophy, Users, type LucideIcon } from "lucide-react";
import { formatDay, formatMonthShort } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { ClubEvent } from "@/types";

export type TileKind = "home" | "road" | "neutral";

export const tileKind = (e: ClubEvent): TileKind => (e.tag === "Matchday" ? "home" : e.tag === "Déplacement" ? "road" : "neutral");

const icons: Record<string, LucideIcon> = {
  "psg-om-classique": Trophy,
  "soiree-des-dames": Sparkles,
  "atelier-chants": Mic,
  "allez-les-filles-dojo": Medal,
  "rencontre-des-membres": Users,
  "deplacement-en-car": Bus,
};

const skin: Record<TileKind, string> = {
  home: "bg-[linear-gradient(180deg,#d31432_0%,#a50d26_100%)] text-white",
  road: "bg-[linear-gradient(180deg,#0f2049_0%,#081230_100%)] text-white",
  neutral: "bg-[#f3f0e8] text-[#0b1a3f] shadow-[inset_0_0_0_2px_rgba(200,16,46,0.75)]",
};

/** Tuile-affiche d'un événement : icône, date en grand, libellé. Rouge = match, marine = déplacement, ivoire = vie du groupe. */
export function ScheduleTile({ event, highlighted, className, ...rest }: { event: ClubEvent; highlighted?: boolean; className?: string } & React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  const kind = tileKind(event);
  const Icon = icons[event.id] ?? Star;
  return (
    <Link
      {...rest}
      href={`/evenements/${event.id}`}
      draggable={false}
      aria-label={`${event.title}, le ${formatDay(event.date)} ${formatMonthShort(event.date)}`}
      data-cursor="view"
      className={cn(
        "group relative flex aspect-[3/4] w-[158px] shrink-0 flex-col items-center overflow-hidden rounded-[6px] px-3 pb-4 pt-3 text-center transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-2 focus-visible:-translate-y-2 sm:w-[184px] lg:w-[204px]",
        skin[kind],
        highlighted && "ring-2 ring-white ring-offset-4 ring-offset-transparent",
        className,
      )}
    >
      <span aria-hidden className="tile-grain pointer-events-none absolute inset-0" />
      <span className="relative flex w-full items-start justify-between font-body text-[10px] font-semibold uppercase tracking-[0.14em] opacity-90">
        {highlighted ? <Star aria-hidden className="size-3.5" fill="currentColor" strokeWidth={0} /> : <span />}
        <span>{event.access}</span>
      </span>
      <Icon aria-hidden className="relative mt-4 size-[clamp(46px,5.4vw,68px)] transition-transform duration-500 group-hover:scale-110" strokeWidth={1.25} />
      <span className="relative mt-auto font-display text-[clamp(38px,4.4vw,54px)] font-bold leading-[0.9] tracking-[0.02em] tabular-nums">
        {formatDay(event.date)}.{monthNumber(event.date)}
      </span>
      <span className="relative mt-2 line-clamp-2 min-h-[2.4em] font-display text-[clamp(12px,1.25vw,15px)] font-semibold uppercase leading-[1.15] tracking-[0.1em]">{event.title}</span>
    </Link>
  );
}

const monthNumber = (iso: string) => iso.slice(5, 7);
