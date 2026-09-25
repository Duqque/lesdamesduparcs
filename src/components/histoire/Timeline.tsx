"use client";

import { motion, useInView, useReducedMotion } from "framer-motion";
import { useRef } from "react";
import { Reveal } from "@/components/ui/Reveal";

interface Item {
  readonly title?: string;
  readonly text: string;
}

/** Suite d'étapes numérotées reliées par un trait qui se dessine à l'affichage. */
export function Timeline({ items, label }: { items: readonly Item[]; label: string }) {
  const ref = useRef<HTMLOListElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -20% 0px" });
  const reduce = useReducedMotion();
  return (
    <ol ref={ref} aria-label={label} className="relative space-y-3">
      <span aria-hidden className="absolute bottom-6 left-[23px] top-6 w-px bg-white/10" />
      <motion.span
        aria-hidden
        className="absolute bottom-6 left-[23px] top-6 w-px origin-top bg-psg-red-bright"
        initial={{ scaleY: reduce ? 1 : 0 }}
        animate={inView ? { scaleY: 1 } : undefined}
        transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1] }}
      />
      {items.map((it, i) => (
        <li key={it.text}>
          <Reveal delay={i * 0.05} className="relative flex min-w-0 items-start gap-5">
            <span className="relative grid size-12 shrink-0 place-items-center rounded-full border border-psg-red-bright/60 bg-night-900 font-display text-[18px] font-semibold tabular-nums text-white">
              {i + 1}
            </span>
            <span className="min-w-0 pt-2.5">
              {it.title && <span className="block break-words font-body text-[17px] font-semibold text-white">{it.title}</span>}
              <span className="block break-words text-mist t-small">{it.text}</span>
            </span>
          </Reveal>
        </li>
      ))}
    </ol>
  );
}
