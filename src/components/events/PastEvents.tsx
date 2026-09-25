"use client";

import { useState } from "react";
import type { ClubEvent } from "@/types";
import { EventGridCard } from "./EventGridCard";

export function PastEvents({ events, initial = 4 }: { events: ClubEvent[]; initial?: number }) {
  const [all, setAll] = useState(false);
  const shown = all ? events : events.slice(0, initial);
  return (
    <>
      <ul className="-mx-[var(--gutter)] flex snap-x gap-4 overflow-x-auto px-[var(--gutter)] pb-4 [scrollbar-width:none] md:mx-0 md:grid md:grid-cols-2 md:gap-6 md:overflow-visible md:px-0 lg:grid-cols-4 [&::-webkit-scrollbar]:hidden">
        {shown.map((e) => (
          <li key={e.id} className="contents md:block">
            <EventGridCard event={e} />
          </li>
        ))}
      </ul>
      {events.length > initial && (
        <div className="mt-16 text-center">
          <button type="button" onClick={() => setAll((v) => !v)} aria-expanded={all} className="inline-flex h-12 min-w-[280px] items-center justify-center rounded-[4px] border border-white/30 px-8 font-body text-[14px] text-white transition-colors hover:bg-white hover:text-night-950">
            {all ? "Voir moins" : "Voir plus d'événements"}
          </button>
        </div>
      )}
    </>
  );
}
