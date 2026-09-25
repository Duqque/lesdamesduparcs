import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CalendarDays, MapPin } from "lucide-react";
import { formatDay, formatMonthShort, formatTime } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { ClubEvent } from "@/types";

const glass = "rounded-full border border-white/20 bg-white/15 backdrop-blur-md";

export const cardSize = "w-[min(78vw,310px)] h-[min(62svh,430px)]";

/** Carte d'événement du calendrier : « photo » plein cadre ou « texte » sombre, dans l'esprit d'un fil d'actualité. */
export function CalendarCard({ event, priority = false, className }: { event: ClubEvent; priority?: boolean; className?: string }) {
  const day = formatDay(event.date);
  const month = formatMonthShort(event.date);
  const href = `/evenements/${event.id}`;

  if (event.variant === "text") {
    return (
      <Link
        href={href}
        draggable={false}
        data-cursor="view"
        aria-label={`${event.title}, le ${day} ${month}`}
        className={cn(
          "group relative flex flex-col overflow-hidden rounded-[22px] border border-white/10 bg-[#101216] p-5 transition-colors duration-500 hover:border-white/25",
          cardSize,
          className,
        )}
      >
        <div className="flex items-start justify-between">
          <span className="grid size-9 place-items-center rounded-full border border-white/25 text-white">
            <CalendarDays aria-hidden className="size-[17px]" strokeWidth={1.7} />
          </span>
          <span className="rounded-full border border-white/20 px-3.5 py-1.5 font-body text-[10.5px] font-medium uppercase tracking-[0.12em] text-white/85">{event.tag}</span>
        </div>

        <div className="mt-auto">
          <div className="relative mb-5 flex h-14 items-center">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="relative -ml-2 first:ml-0 size-12 overflow-hidden rounded-full border-2 border-[#101216]"
                style={{ zIndex: 3 - i }}
              >
                <Image src={event.image} alt="" fill sizes="48px" className="object-cover" style={{ objectPosition: `${20 + i * 30}% 50%` }} />
              </span>
            ))}
          </div>
          <p className="flex items-center gap-3 font-body text-[11px] font-medium uppercase tracking-[0.3em] text-white/70">
            <span aria-hidden className="grid size-5 place-items-center rounded-full border border-white/40">
              <span className="size-1.5 rounded-full bg-white/70" />
            </span>
            {day} {month} · {formatTime(event.time)}
          </p>
          <h3 className="mt-4 font-body text-[27px] font-normal leading-[1.08] tracking-[-0.01em] text-white transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-1">
            {event.title}
          </h3>
          <div className="mt-6 flex items-center gap-2.5">
            <span className="rounded-full bg-white/12 px-4 py-2 font-body text-[12px] font-medium text-white/90">{event.access}</span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/40 px-4 py-2 font-body text-[12px] font-medium text-white transition-colors group-hover:bg-white group-hover:text-night-950">
              Détails <ArrowRight aria-hidden className="size-3.5" />
            </span>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={href}
      draggable={false}
      data-cursor="view"
      aria-label={`${event.title}, le ${day} ${month}`}
      className={cn("group relative block overflow-hidden rounded-[22px] bg-night-900", cardSize, className)}
    >
      <Image
        src={event.image}
        alt={event.imageAlt}
        fill
        priority={priority}
        sizes="(min-width: 768px) 310px, 78vw"
        draggable={false}
        className="object-cover transition-transform duration-[1200ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.05]"
      />
      <div aria-hidden className="absolute inset-0 bg-[linear-gradient(180deg,rgba(3,9,25,0.35)_0%,transparent_28%,transparent_42%,rgba(3,9,25,0.92)_100%)]" />

      <div className="absolute inset-x-4 top-4 flex items-start justify-between">
        <span className={cn(glass, "flex items-center gap-2 py-1.5 pl-2 pr-3.5 font-body text-[12px] font-semibold uppercase tracking-[0.1em] text-white")}>
          <span aria-hidden className="size-2.5 rounded-full bg-psg-red-bright" />
          <span className="tabular-nums">{day}</span> {month}
        </span>
        <span className={cn(glass, "px-3.5 py-1.5 font-body text-[11px] font-medium uppercase tracking-[0.1em] text-white")}>{event.tag}</span>
      </div>

      <div className="absolute inset-x-5 bottom-5">
        <p className="flex items-center gap-2 font-body text-[10.5px] font-medium uppercase tracking-[0.28em] text-white/75">
          <MapPin aria-hidden className="size-3.5" strokeWidth={1.8} />
          {event.venue}
        </p>
        <h3 className="mt-3 font-body text-[27px] font-normal leading-[1.08] tracking-[-0.01em] text-white transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-1">
          {event.title}
        </h3>
        <div className="mt-5 flex items-center justify-between gap-3">
          <span className="font-body text-[12px] text-white/75">{formatTime(event.time)}</span>
          <span className={cn(glass, "inline-flex items-center gap-1.5 px-4 py-2 font-body text-[12px] font-medium text-white transition-colors group-hover:bg-white group-hover:text-night-950")}>
            Détails <ArrowRight aria-hidden className="size-3.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}
