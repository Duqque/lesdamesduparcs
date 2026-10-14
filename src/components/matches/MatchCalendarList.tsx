"use client";

import Link from "next/link";
import { useState } from "react";

/** Une ligne du calendrier, déjà mise en forme côté serveur (date affichée comprise : pas d'écart de fuseau horaire). */
export type CalendarRow = { id: string; date: string; label: string; title: string; competition?: string; relatedId?: string; ticketHref: string };

/**
 * « Tout le calendrier » : liste repliée par défaut. Ses lignes ne sont construites qu'à l'ouverture (éco-conception) :
 * la page n'embarque que ces données compactes au lieu d'une cinquantaine de lignes de HTML que la plupart des visiteuses n'ouvrent jamais.
 */
export function MatchCalendarList({ rows }: { rows: CalendarRow[] }) {
  const [open, setOpen] = useState(false);
  return (
    <details className="group mt-6 rounded-[8px] border border-line bg-night-900/60" onToggle={(e) => setOpen(e.currentTarget.open)}>
      <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between px-5 font-body text-[14px] font-medium text-white [&::-webkit-details-marker]:hidden">
        Tout le calendrier ({rows.length} autres matchs)
        <span aria-hidden className="text-mist transition-transform duration-300 group-open:rotate-180">⌄</span>
      </summary>
      {open && (
        <ul className="divide-y divide-white/10 border-t border-white/10">
          {rows.map((m) => (
            <li key={m.id} className="grid grid-cols-[auto_1fr] items-center gap-x-4 gap-y-2 px-5 py-3 sm:grid-cols-[150px_1fr_auto]">
              <time dateTime={m.date} className="font-body text-[13px] tabular-nums text-white/80">{m.label}</time>
              <span className="min-w-0 font-body text-[14px] text-white">
                <span className="font-medium">{m.title}</span>
                {m.competition && <span className="ml-2 text-[12px] text-mist">{m.competition}</span>}
              </span>
              <span className="col-span-2 flex flex-wrap items-center gap-3 sm:col-span-1 sm:justify-end">
                {m.relatedId && <Link href={`/evenements/${m.relatedId}`} className="font-body text-[12.5px] font-medium text-psg-red-bright underline underline-offset-4">Vivre le match avec les Dames</Link>}
                <a href={m.ticketHref} target="_blank" rel="noopener noreferrer" className="font-body text-[12.5px] text-white/75 underline underline-offset-4 hover:text-white">Billetterie</a>
              </span>
            </li>
          ))}
        </ul>
      )}
    </details>
  );
}
