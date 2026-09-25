"use client";

import { useInView, useReducedMotion, type Transition } from "framer-motion";
import { useRef, type ReactNode, type RefObject } from "react";
import { cn } from "@/lib/cn";

export const RED = "#f01634";
export const BLUE = "#3d6bd6";
export const SKY = "#8fb0ff";
export const WHITE = "#f4f6fa";
export const INK = "#0b1e3d";
export const ROYAL = "#12285a";

/** Origine de transformation centrée sur l'élément, pour animer l'échelle sans sortir du cadre. */
export const CENTER = { transformBox: "fill-box", transformOrigin: "center" } as const;

/** Déclenche l'animation à l'entrée dans l'écran ; sans animation si l'utilisateur la réduit. */
export function useArt() {
  const ref = useRef<SVGSVGElement>(null);
  const seen = useInView(ref, { once: true, margin: "0px 0px -15% 0px" });
  const reduce = useReducedMotion() ?? false;
  const tr = (delay = 0, duration = 0.8): Transition => (reduce ? { duration: 0 } : { duration, delay, ease: [0.22, 1, 0.36, 1] });
  const loop = (duration: number, delay = 0): Transition => (reduce ? { duration: 0 } : { duration, delay, repeat: Infinity, ease: "easeInOut" });
  return { ref, on: seen || reduce, reduce, tr, loop };
}

interface Props {
  label: string;
  viewBox: string;
  svgRef: RefObject<SVGSVGElement | null>;
  children: ReactNode;
  className?: string;
}

/** Cadre commun des illustrations : tout est rogné à l'intérieur, rien ne peut dépasser. */
export function ArtFrame({ label, viewBox, svgRef, children, className }: Props) {
  return (
    <figure
      role="img"
      aria-label={label}
      className={cn(
        "relative w-full overflow-hidden rounded-[10px] border border-line bg-[radial-gradient(ellipse_80%_70%_at_50%_45%,rgba(27,63,143,0.35),rgba(6,18,38,0.92))]",
        className,
      )}
    >
      <svg ref={svgRef} viewBox={viewBox} className="block h-auto w-full" aria-hidden focusable="false">
        {children}
      </svg>
    </figure>
  );
}
