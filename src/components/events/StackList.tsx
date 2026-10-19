"use client";

import { useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";

/** Grille des cartes d'événements utilisée sur les pages Événements. */
export const STACK_GRID = "grid gap-4 md:grid-cols-2 md:gap-6 lg:grid-cols-4";

/**
 * Liste de cartes : sur mobile, les cartes sont empilées les unes sous les autres (lecture plus facile qu'un défilement
 * horizontal), `limit` au plus, puis un bouton « Afficher plus ». Dès la tablette, grille complète, sans bouton.
 */
export function StackList({ items, limit = 5, className = STACK_GRID }: { items: Array<{ key: string; className?: string; node: ReactNode }>; limit?: number; className?: string }) {
  const [all, setAll] = useState(false);
  const hidden = items.length - limit;
  return (
    <>
      <ul className={className}>
        {items.map((it, i) => (
          <li key={it.key} className={cn("flex [&>*]:!w-full", it.className, !all && i >= limit && "max-md:hidden")}>
            {it.node}
          </li>
        ))}
      </ul>
      {hidden > 0 && !all && (
        <div className="mt-8 text-center md:hidden">
          <button type="button" onClick={() => setAll(true)} className="inline-flex h-12 w-full items-center justify-center rounded-[4px] border border-white/30 px-8 font-body text-[14px] text-white transition-colors hover:bg-white hover:text-night-950">
            Afficher plus ({hidden})
          </button>
        </div>
      )}
    </>
  );
}
