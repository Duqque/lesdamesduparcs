"use client";

import { useState } from "react";
import { EventGridCard, type EventCardData } from "./EventGridCard";

export function PastEvents({ events, initial = 4 }: { events: EventCardData[]; initial?: number }) {
  const [all, setAll] = useState(false);
  const shown = all ? events : events.slice(0, initial);
  return (
    <>
      {/* Mobile : cartes empilées les unes sous les autres ; dès la tablette, grille. */}
      <ul className="grid gap-4 md:grid-cols-2 md:gap-6 lg:grid-cols-4">
        {shown.map((e) => (
          <li key={e.id} className="flex">
            <EventGridCard event={e} className="!w-full" />
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
