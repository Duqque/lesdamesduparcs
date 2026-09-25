"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type PointerEvent } from "react";
import { ChevronLeft, ChevronRight, Download } from "lucide-react";
import { formatLongDate, formatTime } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { ClubEvent } from "@/types";
import { ScheduleTile, tileKind, type TileKind } from "./ScheduleTile";

type Filter = "all" | TileKind;

const legend: { id: Filter; label: string; swatch: string }[] = [
  { id: "home", label: "Match", swatch: "bg-[#c8102e] text-white" },
  { id: "road", label: "Déplacement", swatch: "bg-[#0b1a3f] text-white ring-1 ring-white/25" },
  { id: "neutral", label: "Vie du groupe", swatch: "bg-[#f3f0e8] text-[#0b1a3f] shadow-[inset_0_0_0_2px_rgba(200,16,46,0.7)]" },
];

export function ScheduleBoard({ events, highlightedId, season }: { events: ClubEvent[]; highlightedId: string; season: string }) {
  const [filter, setFilter] = useState<Filter>("all");
  const [activeId, setActiveId] = useState(highlightedId);
  const list = useMemo(() => (filter === "all" ? events : events.filter((e) => tileKind(e) === filter)), [events, filter]);
  const active = list.find((e) => e.id === activeId) ?? list[0];

  const ref = useRef<HTMLUListElement>(null);
  const drag = useRef({ down: false, x: 0, left: 0, moved: 0 });
  const [edges, setEdges] = useState({ start: true, end: false });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => setEdges({ start: el.scrollLeft < 8, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 8 });
    el.scrollLeft = 0;
    const raf = requestAnimationFrame(update);
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [filter]);

  const scrollBy = (dir: 1 | -1) => ref.current?.scrollBy({ left: dir * ref.current.clientWidth * 0.7, behavior: "smooth" });

  const onDown = (e: PointerEvent<HTMLUListElement>) => {
    if (e.pointerType !== "mouse" || !ref.current) return;
    drag.current = { down: true, x: e.clientX, left: ref.current.scrollLeft, moved: 0 };
    ref.current.style.scrollSnapType = "none";
  };
  const onMove = (e: PointerEvent<HTMLUListElement>) => {
    const d = drag.current;
    if (!d.down || !ref.current) return;
    d.moved = Math.max(d.moved, Math.abs(e.clientX - d.x));
    ref.current.scrollLeft = d.left - (e.clientX - d.x);
  };
  const onUp = () => {
    if (!drag.current.down || !ref.current) return;
    drag.current.down = false;
    ref.current.style.scrollSnapType = "";
  };

  return (
    <section aria-labelledby="events-title" className="relative isolate overflow-hidden px-[var(--gutter)] pb-32 pt-[190px] md:pb-44 md:pt-[250px]">
      <div aria-hidden className="absolute inset-0 -z-10">
        <Image src="/images/drapeau-paris-gros-plan.webp" alt="" fill priority sizes="100vw" className="scale-125 object-cover blur-[34px] saturate-[1.2]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(3,9,25,0.55)_0%,rgba(10,26,72,0.35)_45%,rgba(3,9,25,0.92)_100%)]" />
        <div className="tile-grain absolute inset-0 opacity-70" />
      </div>

      <div className="mx-auto max-w-[1200px]">
        <div className="relative rounded-[clamp(28px,4vw,52px)] border border-white/30 bg-white/[0.07] px-[clamp(20px,4vw,64px)] pb-[clamp(28px,4vw,56px)] pt-[clamp(32px,5vw,72px)] shadow-[inset_0_0_60px_rgba(255,255,255,0.06),0_40px_120px_-40px_rgba(0,0,0,0.8)] backdrop-blur-2xl">
          <div className="text-center">
            <p className="font-display text-[clamp(20px,3vw,44px)] font-light uppercase leading-none tracking-[0.2em] text-white/90">Saison {season}</p>
            <h1 id="events-title" className="mt-2 origin-top scale-y-[1.14] font-display text-[clamp(64px,15.5vw,210px)] font-bold uppercase leading-[0.86] tracking-[-0.01em] text-white [text-shadow:0_2px_40px_rgba(3,9,25,0.35)]">
              Calendrier
            </h1>
          </div>

          <div className="relative mt-[clamp(40px,6vw,88px)]">
            <ul
              ref={ref}
              role="list"
              aria-label="Événements de la saison, faites défiler horizontalement"
              tabIndex={0}
              onPointerDown={onDown}
              onPointerMove={onMove}
              onPointerUp={onUp}
              onPointerLeave={onUp}
              onDragStart={(e) => e.preventDefault()}
              onClickCapture={(e) => {
                if (drag.current.moved > 6) {
                  e.preventDefault();
                  e.stopPropagation();
                  drag.current.moved = 0;
                }
              }}
              className="-mx-2 flex snap-x snap-mandatory gap-[clamp(10px,1.4vw,18px)] overflow-x-auto overscroll-x-contain px-2 pb-6 pt-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {list.map((e) => (
                <li key={e.id} className="snap-start" onMouseEnter={() => setActiveId(e.id)} onFocus={() => setActiveId(e.id)}>
                  <ScheduleTile event={e} highlighted={e.id === highlightedId} />
                </li>
              ))}
            </ul>
            <div aria-hidden className={cn("pointer-events-none absolute inset-y-0 right-0 w-14 bg-gradient-to-l from-[rgba(10,20,50,0.55)] to-transparent transition-opacity", edges.end && "opacity-0")} />
            <div aria-hidden className={cn("pointer-events-none absolute inset-y-0 left-0 w-14 bg-gradient-to-r from-[rgba(10,20,50,0.55)] to-transparent transition-opacity", edges.start && "opacity-0")} />
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-6 border-t border-white/15 pt-8">
            <div className="min-w-0">
              {active ? (
                <>
                  <p aria-live="polite" className="font-display text-[clamp(22px,2.4vw,32px)] font-semibold uppercase leading-tight tracking-[0.06em] text-white">
                    {active.title}
                  </p>
                  <p className="mt-2 font-body text-[14px] text-white/75">
                    {formatLongDate(active.date)} · {formatTime(active.time)} · {active.venue}
                  </p>
                </>
              ) : (
                <p className="font-body text-white/75">Aucun événement dans cette catégorie.</p>
              )}
            </div>
            <div className="flex items-center gap-3">
              {active && (
                <Link href={`/evenements/${active.id}`} className="inline-flex h-11 items-center rounded-[10px] border border-white/25 bg-white/10 px-5 font-body text-[14px] font-medium text-white backdrop-blur-md transition-colors hover:bg-white hover:text-night-950">
                  Voir l&rsquo;événement
                </Link>
              )}
              <button type="button" onClick={() => scrollBy(-1)} disabled={edges.start} aria-label="Défiler vers la gauche" className="grid size-11 place-items-center rounded-full border border-white/25 text-white transition-colors hover:bg-white hover:text-night-950 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-white">
                <ChevronLeft aria-hidden className="size-5" />
              </button>
              <button type="button" onClick={() => scrollBy(1)} disabled={edges.end} aria-label="Défiler vers la droite" className="grid size-11 place-items-center rounded-full border border-white/25 text-white transition-colors hover:bg-white hover:text-night-950 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-white">
                <ChevronRight aria-hidden className="size-5" />
              </button>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-5">
          <div role="group" aria-label="Filtrer les événements" className="flex flex-wrap gap-3">
            <button
              type="button"
              aria-pressed={filter === "all"}
              onClick={() => setFilter("all")}
              className={cn("min-h-11 rounded-[4px] border px-6 font-display text-[16px] font-semibold uppercase tracking-[0.14em] transition-colors", filter === "all" ? "border-white bg-white text-night-950" : "border-white/30 text-white hover:border-white")}
            >
              Tous
            </button>
            {legend.map((l) => (
              <button
                key={l.id}
                type="button"
                aria-pressed={filter === l.id}
                onClick={() => setFilter(filter === l.id ? "all" : l.id)}
                className={cn("min-h-11 rounded-[4px] px-6 font-display text-[16px] font-semibold uppercase tracking-[0.14em] transition-[transform,box-shadow]", l.swatch, filter === l.id ? "scale-105 outline outline-2 outline-offset-4 outline-white" : "opacity-90 hover:opacity-100")}
              >
                {l.label}
              </button>
            ))}
          </div>
          <Link href="/evenements/calendrier.ics" prefetch={false} className="inline-flex min-h-11 items-center gap-2 font-body text-[13px] font-medium text-white/80 transition-colors hover:text-white">
            <Download aria-hidden className="size-4" strokeWidth={1.8} />
            Ajouter à mon agenda
          </Link>
        </div>
      </div>
    </section>
  );
}
