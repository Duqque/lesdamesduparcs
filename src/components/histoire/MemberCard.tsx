"use client";

import Image from "next/image";
import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { RotateCw } from "lucide-react";

/** Exemple de carte de membre virtuelle : on la retourne d'un clic. */
export function MemberCard({ season }: { season: string }) {
  const [back, setBack] = useState(false);
  const reduce = useReducedMotion();
  return (
    <div className="mx-auto w-full max-w-[420px]">
      <button
        type="button"
        onClick={() => setBack((b) => !b)}
        aria-pressed={back}
        aria-label={back ? "Voir le recto de la carte" : "Voir le verso de la carte"}
        className="block w-full [perspective:1200px]"
      >
        <motion.div
          className="relative aspect-[1.586/1] w-full [transform-style:preserve-3d]"
          animate={{ rotateY: back ? 180 : 0 }}
          transition={reduce ? { duration: 0 } : { duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="absolute inset-0 overflow-hidden rounded-[14px] border border-white/15 bg-[linear-gradient(135deg,#12285a_0%,#061226_60%,#3a0a14_100%)] p-5 text-left [backface-visibility:hidden]">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="t-eyebrow">Membre adhérente</p>
                <p className="mt-2 break-words font-display text-[24px] font-semibold uppercase leading-none tracking-[0.05em] text-white">Les Dames du Parc</p>
              </div>
              <Image src="/logos/dames-du-parc-logo.webp" alt="" width={56} height={56} className="size-14 shrink-0 rounded-full" />
            </div>
            <div className="absolute inset-x-5 bottom-5 flex items-end justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[11px] uppercase tracking-[0.2em] text-mist">Saison</p>
                <p className="font-display text-[26px] font-semibold tabular-nums text-white">{season}</p>
              </div>
              <span aria-hidden className="grid size-9 place-items-center rounded-full border border-white/20 text-white/70">
                <RotateCw className="size-4" />
              </span>
            </div>
          </div>
          <div className="absolute inset-0 grid place-items-center overflow-hidden rounded-[14px] border border-white/15 bg-[linear-gradient(135deg,#0b1e3d,#12285a)] p-5 [backface-visibility:hidden] [transform:rotateY(180deg)]">
            <div aria-hidden className="grid size-[46%] grid-cols-7 gap-[3px] rounded-[6px] bg-white p-2">
              {Array.from({ length: 49 }, (_, i) => (
                <span key={i} className={(i * 11 + (i % 4) * 5) % 3 === 0 || [0, 6, 42, 48].includes(i) ? "rounded-[1px] bg-night-950" : "bg-transparent"} />
              ))}
            </div>
            <p className="absolute inset-x-5 bottom-4 text-center text-[12px] uppercase tracking-[0.2em] text-mist">Exemple de carte virtuelle</p>
          </div>
        </motion.div>
      </button>
    </div>
  );
}
