"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { ChevronLeft, ChevronRight, Download } from "lucide-react";
import { formatLongDate, formatMonthShort } from "@/lib/format";
import { cn } from "@/lib/cn";
import { eventTags } from "@/data/events";
import type { ClubEvent } from "@/types";
import { CalendarCard } from "./CalendarCard";

interface Props {
  events: ClubEvent[];
  startId: string;
}

export function EventCarousel({ events, startId }: Props) {
  const [filter, setFilter] = useState<(typeof eventTags)[number]>("Tous");
  const list = useMemo(() => (filter === "Tous" ? events : events.filter((e) => e.tag === filter)), [events, filter]);
  const tags = eventTags.filter((t) => t === "Tous" || events.some((e) => e.tag === t));
  return (
    <section aria-labelledby="events-title" className="pb-20 pt-[104px] md:pt-[120px]">
      <Scroller key={filter} list={list} startId={startId} filter={filter} tags={tags} onFilter={setFilter} />
    </section>
  );
}

function Scroller({ list, startId, filter, tags, onFilter }: { list: ClubEvent[]; startId: string; filter: string; tags: readonly (typeof eventTags)[number][]; onFilter: (f: (typeof eventTags)[number]) => void }) {
  const ref = useRef<HTMLUListElement>(null);
  const start = Math.max(0, list.findIndex((e) => e.id === startId));
  const [active, setActive] = useState(start);
  const drag = useRef({ down: false, x: 0, left: 0, moved: 0 });

  const update = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const mid = el.scrollLeft + el.clientWidth / 2;
    let best = 0;
    let bestD = Infinity;
    Array.from(el.children).forEach((node, i) => {
      const li = node as HTMLElement;
      const d = Math.abs(li.offsetLeft + li.offsetWidth / 2 - mid);
      const k = Math.max(0, 1 - d / (li.offsetWidth * 1.35));
      li.style.transform = `scale(${0.9 + 0.1 * k})`;
      li.style.opacity = String(0.5 + 0.5 * k);
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    });
    setActive((prev) => (prev === best ? prev : best));
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const li = el.children[start] as HTMLElement | undefined;
    if (li) {
      el.style.scrollBehavior = "auto";
      el.scrollLeft = li.offsetLeft + li.offsetWidth / 2 - el.clientWidth / 2;
      el.style.scrollBehavior = "";
    }
    let raf = requestAnimationFrame(update);
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [start, update]);

  const goTo = (i: number) => {
    const el = ref.current;
    const li = el?.children[Math.min(Math.max(i, 0), list.length - 1)] as HTMLElement | undefined;
    li?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  };

  const onKey = (e: KeyboardEvent) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      goTo(active + 1);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      goTo(active - 1);
    }
  };

  const onDown = (e: PointerEvent<HTMLUListElement>) => {
    if (e.pointerType !== "mouse" || !ref.current) return;
    drag.current = { down: true, x: e.clientX, left: ref.current.scrollLeft, moved: 0 };
    ref.current.style.scrollSnapType = "none";
    ref.current.style.scrollBehavior = "auto";
  };
  const onMove = (e: PointerEvent<HTMLUListElement>) => {
    const d = drag.current;
    if (!d.down || !ref.current) return;
    d.moved = Math.max(d.moved, Math.abs(e.clientX - d.x));
    ref.current.scrollLeft = d.left - (e.clientX - d.x);
  };
  const onUp = () => {
    const d = drag.current;
    if (!d.down || !ref.current) return;
    d.down = false;
    ref.current.style.scrollSnapType = "";
    ref.current.style.scrollBehavior = "";
    goTo(active);
  };

  const first = list[0]?.date;
  const last = list[list.length - 1]?.date;
  const span = first && last ? Math.max(new Date(last).getTime() - new Date(first).getTime(), 1) : 1;
  const pos = (date: string) => (first ? ((new Date(date).getTime() - new Date(first).getTime()) / span) * 100 : 0);
  const current = list[active];

  const months = Array.from(new Set(list.map((e) => e.date.slice(0, 7)))).map((m) => ({ m, label: formatMonthShort(`${m}-01`), left: pos(`${m}-01`) }));

  return (
    <>
      <div className="mx-auto flex max-w-[1500px] flex-wrap items-end justify-between gap-6 px-[var(--gutter)]">
        <div>
          <h1 id="events-title" className="flex items-center gap-3 font-body text-[clamp(22px,2.6vw,34px)] font-light tracking-[-0.01em] text-white">
            <span aria-hidden className="size-3.5 animate-pulse rounded-full bg-psg-red-bright shadow-[0_0_14px_rgba(240,22,52,0.8)]" />
            Événements <span className="text-mist">({list.length})</span>
          </h1>
          <p aria-live="polite" className="mt-1.5 font-body text-[14px] text-mist">
            {current ? formatLongDate(current.date) : "Aucun événement"}
          </p>
        </div>
        <div role="group" aria-label="Filtrer par type" className="flex flex-wrap gap-2">
          {tags.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => onFilter(t)}
              aria-pressed={filter === t}
              className={cn(
                "min-h-11 rounded-full border px-4 font-body text-[12.5px] font-medium transition-colors md:min-h-10",
                filter === t ? "border-white bg-white text-night-950" : "border-white/15 bg-white/[0.06] text-white/85 hover:border-white/40 hover:text-white",
              )}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {list.length > 1 && (
        <div aria-hidden className="mx-auto mt-8 max-w-[1500px] px-[var(--gutter)]">
          <div className="relative h-px bg-white/15">
            {list.map((e, i) => (
              <button
                key={e.id}
                type="button"
                tabIndex={-1}
                onClick={() => goTo(i)}
                className={cn(
                  "absolute top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full transition-[width,height,background-color] duration-300",
                  i === active ? "size-3 bg-psg-red-bright shadow-[0_0_12px_rgba(240,22,52,0.9)]" : "size-1.5 bg-white/45 hover:bg-white",
                )}
                style={{ left: `${pos(e.date)}%` }}
              />
            ))}
          </div>
          <div className="relative mt-3 h-4">
            {months.map((m) => (
              <span key={m.m} className="absolute -translate-x-1/2 font-body text-[10px] font-medium uppercase tracking-[0.25em] text-mist" style={{ left: `${Math.min(Math.max(m.left, 2), 98)}%` }}>
                {m.label}
              </span>
            ))}
          </div>
        </div>
      )}

      <ul
        ref={ref}
        role="list"
        tabIndex={0}
        aria-label="Calendrier des événements, faites défiler horizontalement"
        onKeyDown={onKey}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerLeave={onUp}
        onClickCapture={(e) => {
          if (drag.current.moved > 6) {
            e.preventDefault();
            e.stopPropagation();
            drag.current.moved = 0;
          }
        }}
        onDragStart={(e) => e.preventDefault()}
        className="relative mt-6 flex snap-x snap-mandatory items-center gap-4 overflow-x-auto overscroll-x-contain scroll-smooth px-[calc(50%-min(39vw,155px))] py-6 [scrollbar-width:none] md:gap-5 md:px-[calc(50%-155px)] [&::-webkit-scrollbar]:hidden"
      >
        {list.map((e, i) => (
          <li key={e.id} className="shrink-0 snap-center transition-[transform,opacity] duration-150 will-change-transform">
            <CalendarCard event={e} priority={i === start} />
          </li>
        ))}
      </ul>

      <div className="mx-auto mt-2 flex max-w-[1500px] items-center justify-between gap-4 px-[var(--gutter)]">
        <Link
          href="/evenements/calendrier.ics"
          prefetch={false}
          className="inline-flex min-h-11 items-center gap-2 font-body text-[12.5px] font-medium text-white/80 transition-colors hover:text-white"
        >
          <Download aria-hidden className="size-4" strokeWidth={1.8} />
          Ajouter tous les événements à mon agenda
        </Link>
        <div className="flex items-center gap-2">
          <span className="mr-2 hidden font-body text-[11px] uppercase tracking-[0.2em] text-mist sm:block">
            {active + 1} / {list.length}
          </span>
          <button type="button" onClick={() => goTo(active - 1)} disabled={active === 0} aria-label="Événement précédent" className="grid size-11 place-items-center rounded-full border border-white/20 text-white transition-colors hover:bg-white hover:text-night-950 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-white">
            <ChevronLeft aria-hidden className="size-5" />
          </button>
          <button type="button" onClick={() => goTo(active + 1)} disabled={active >= list.length - 1} aria-label="Événement suivant" className="grid size-11 place-items-center rounded-full border border-white/20 text-white transition-colors hover:bg-white hover:text-night-950 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-white">
            <ChevronRight aria-hidden className="size-5" />
          </button>
        </div>
      </div>
    </>
  );
}
