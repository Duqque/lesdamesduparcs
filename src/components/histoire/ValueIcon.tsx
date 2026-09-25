"use client";

import { motion, useInView, useReducedMotion } from "framer-motion";
import { Flame, HeartHandshake, Infinity as InfinityIcon, Megaphone, Sprout, Users, type LucideIcon } from "lucide-react";
import { useRef } from "react";

interface Spec {
  Icon: LucideIcon;
  animate: Record<string, number[]>;
  origin?: string;
}

const specs: Record<string, Spec> = {
  Passion: { Icon: Flame, animate: { scaleY: [1, 1.12, 0.96, 1.08, 1], rotate: [0, -3, 3, -2, 0] }, origin: "50% 100%" },
  Fidélité: { Icon: InfinityIcon, animate: { rotate: [0, 6, -6, 0], scale: [1, 1.08, 1] } },
  Bienveillance: { Icon: HeartHandshake, animate: { scale: [1, 1.14, 1, 1.1, 1] } },
  Sororité: { Icon: Users, animate: { y: [0, -4, 0] } },
  Transmission: { Icon: Sprout, animate: { scaleY: [0.85, 1.1, 0.85] }, origin: "50% 100%" },
  Engagement: { Icon: Megaphone, animate: { rotate: [0, -10, 6, -6, 0], x: [0, 2, 0] } },
};

/** Icône de valeur : cadre rond fixe, l'icône s'anime à l'intérieur sans jamais en sortir. */
export function ValueIcon({ name }: { name: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { margin: "0px 0px -10% 0px" });
  const reduce = useReducedMotion();
  const spec = specs[name] ?? specs.Passion;
  const { Icon } = spec;
  return (
    <span ref={ref} aria-hidden className="relative grid size-16 shrink-0 place-items-center overflow-hidden rounded-full border border-psg-red-bright/50 bg-night-800">
      <motion.span
        className="grid place-items-center"
        style={{ transformOrigin: spec.origin ?? "50% 50%" }}
        animate={inView && !reduce ? spec.animate : undefined}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
      >
        <Icon className="size-7 text-white" strokeWidth={1.6} />
      </motion.span>
    </span>
  );
}
