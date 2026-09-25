"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";

interface Item {
  readonly q: string;
  readonly a: string;
}

/** Questions fréquentes : un volet s'ouvre à la fois. */
export function Faq({ items }: { items: readonly Item[] }) {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <ul className="divide-y divide-white/10 overflow-hidden rounded-[10px] border border-line bg-night-900/85">
      {items.map((it, i) => (
        <li key={it.q}>
          <h3>
            <button
              type="button"
              aria-expanded={open === i}
              aria-controls={`faq-${i}`}
              onClick={() => setOpen(open === i ? null : i)}
              className="flex min-h-14 w-full items-center justify-between gap-4 px-5 py-4 text-left font-body text-[16px] font-semibold text-white transition-colors hover:bg-white/[0.03] md:px-7"
            >
              <span className="min-w-0 break-words">{it.q}</span>
              <ChevronDown aria-hidden className={cn("size-5 shrink-0 text-psg-red-bright transition-transform duration-300", open === i && "rotate-180")} />
            </button>
          </h3>
          <div id={`faq-${i}`} role="region" className={cn("grid transition-[grid-template-rows] duration-300 ease-out", open === i ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
            <div className="overflow-hidden">
              <p className="break-words px-5 pb-5 text-white/80 t-small md:px-7">{it.a}</p>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
