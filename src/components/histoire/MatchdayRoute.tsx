"use client";

import { motion, useInView, useReducedMotion } from "framer-motion";
import { Beer, CircleDot, Footprints, Gamepad2, Shirt, Trophy, Utensils, type LucideIcon } from "lucide-react";
import { useRef } from "react";
import { Reveal } from "@/components/ui/Reveal";

const stops: { Icon: LucideIcon; label: string; text: string }[] = [
  { Icon: Shirt, label: "Les vestiaires", text: "Découvrir ou redécouvrir le Parc des Princes autrement." },
  { Icon: Footprints, label: "L’entrée sur la pelouse", text: "Le chemin des joueurs, côté coulisses." },
  { Icon: Trophy, label: "L’exposition des trophées", text: "Les trophées remportés par le club." },
  { Icon: Utensils, label: "Le restaurant", text: "La journée se termine autour d’une table." },
  { Icon: Gamepad2, label: "Le parc d’activités", text: "Parce que la communauté existe aussi en dehors des jours de match." },
  { Icon: Beer, label: "Un verre en terrasse", text: "Des moments informels, sans programme." },
  { Icon: CircleDot, label: "Les soirées bowling", text: "Des liens qui vont bien au-delà du football." },
];

/** Le parcours d'une journée hors match : un fil rouge qui relie chaque étape. */
export function MatchdayRoute() {
  const ref = useRef<HTMLOListElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -20% 0px" });
  const reduce = useReducedMotion();
  return (
    <ol ref={ref} aria-label="Les rendez-vous en dehors des jours de match" className="relative space-y-2">
      <span aria-hidden className="absolute bottom-8 left-[27px] top-8 w-0.5 bg-white/10" />
      <motion.span
        aria-hidden
        className="absolute bottom-8 left-[27px] top-8 w-0.5 origin-top bg-psg-red-bright"
        initial={{ scaleY: reduce ? 1 : 0 }}
        animate={inView ? { scaleY: 1 } : undefined}
        transition={{ duration: 2.2, ease: [0.22, 1, 0.36, 1] }}
      />
      {stops.map(({ Icon, label, text }, i) => (
        <li key={label}>
          <Reveal delay={i * 0.06} className="relative flex min-w-0 items-center gap-5 py-3">
            <span className="relative grid size-14 shrink-0 place-items-center overflow-hidden rounded-full border border-psg-red-bright/60 bg-night-900">
              <Icon aria-hidden className="size-6 text-white" strokeWidth={1.6} />
            </span>
            <span className="min-w-0">
              <span className="block break-words font-body text-[17px] font-semibold text-white">{label}</span>
              <span className="block break-words text-mist t-small">{text}</span>
            </span>
          </Reveal>
        </li>
      ))}
    </ol>
  );
}
