import Image from "next/image";
import Link from "next/link";
import { formatDay } from "@/lib/format";
import { cn } from "@/lib/cn";
import { isPast } from "@/data/events";
import type { ClubEvent } from "@/types";
import { Tone } from "@/components/news/NewsCard";

const monthName = (iso: string) => new Intl.DateTimeFormat("fr-FR", { month: "long", timeZone: "UTC" }).format(new Date(`${iso}T12:00:00Z`));

/** Carte d'événement : titre, date en grand, visuel et barre d'actions (S'inscrire | Plus d'infos). */
export function EventGridCard({ event, className }: { event: ClubEvent; className?: string }) {
  const past = isPast(event);
  const month = monthName(event.date);
  const href = `/evenements/${event.id}`;
  const open = !past && event.registration.mode !== "closed";
  return (
    <article className={cn("group flex h-full w-[min(78vw,290px)] shrink-0 snap-start flex-col overflow-hidden rounded-[4px] bg-[#f3f0e8] text-[#0b1a3f] md:w-auto", className)}>
      <div className="flex flex-1 flex-col px-[clamp(16px,1.6vw,24px)] pb-6 pt-7">
        <h3 className="min-h-[3.9em] font-body text-[13.5px] font-medium leading-[1.45] text-[#0b1a3f]/85">{event.title}</h3>
        <p className="mt-4 flex items-end gap-2.5">
          <span aria-hidden className="font-display text-[clamp(56px,5.6vw,80px)] font-medium leading-[0.85] tracking-[0.01em] tabular-nums">{formatDay(event.date).replace(/^0/, "")}</span>
          <span aria-hidden className="whitespace-nowrap pb-1 font-body text-[clamp(15px,1.3vw,18px)] font-medium capitalize leading-none text-[#0b1a3f]/85">{month}</span>
          <time className="sr-only" dateTime={event.date}>{formatDay(event.date)} {month}</time>
        </p>
      </div>
      <div className="relative aspect-[4/2.6] overflow-hidden bg-night-900">
        <Image src={event.image} alt={event.imageAlt} fill sizes="(min-width: 1024px) 22vw, (min-width: 768px) 45vw, 78vw" className="object-cover saturate-[0.8] transition-transform duration-[1200ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.06]" />
        <Tone />
      </div>
      <div className="grid divide-x divide-white/15 bg-night-900 font-body text-[13px] text-white" style={{ gridTemplateColumns: open ? "1fr 1fr" : "1fr" }}>
        {open && (
          <Link href={event.registration.mode === "external" ? event.href : `${href}#inscription`} className="grid min-h-11 place-items-center px-3 transition-colors hover:bg-[#c8102e]">
            {event.registration.mode === "external" ? "Billetterie" : "S'inscrire"}
          </Link>
        )}
        <Link href={href} className="grid min-h-11 place-items-center px-3 transition-colors hover:bg-white/10">
          Plus d&rsquo;infos
        </Link>
      </div>
    </article>
  );
}
