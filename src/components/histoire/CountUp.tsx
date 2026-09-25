"use client";

import { animate, useInView, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

interface Props {
  to: number;
  prefix?: string;
  className?: string;
}

/** Compteur qui s'anime une seule fois, à l'entrée dans l'écran. */
export function CountUp({ to, prefix = "", className }: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -10% 0px" });
  const reduce = useReducedMotion();
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!inView || reduce) return;
    const controls = animate(0, to, { duration: 1.6, ease: [0.22, 1, 0.36, 1], onUpdate: (v) => setValue(Math.round(v)) });
    return () => controls.stop();
  }, [inView, reduce, to]);

  const shown = reduce ? (inView ? to : 0) : value;

  return (
    <span ref={ref} className={className}>
      {prefix}
      {shown.toLocaleString("fr-FR")}
    </span>
  );
}
