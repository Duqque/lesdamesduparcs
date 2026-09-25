"use client";

import { useMotionValueEvent, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { useRef, useState } from "react";
import { manifesto } from "@/data/manifesto";
import { Scarf3D } from "./Scarf3D";

/** Manifeste : grand texte centré écrit lettre par lettre au fil du scroll, sous une petite écharpe 3D. */
export function Manifesto() {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 85%", "center 38%"] });
  const typing = useTransform(scrollYProgress, [0.1, 0.95], [0, 1], { clamp: true });
  const total = manifesto.text.length;
  const [count, setCount] = useState(0);

  useMotionValueEvent(typing, "change", (v) => {
    const next = Math.round(v * total);
    setCount((prev) => (prev === next ? prev : next));
  });

  const shown = reduce ? total : count;
  const typed = manifesto.text.slice(0, shown);
  const rest = manifesto.text.slice(shown);
  const typingNow = shown > 0 && shown < total;

  return (
    <section ref={ref} aria-labelledby="manifeste-title" className="mx-auto max-w-[1200px] px-[var(--gutter)] py-28 text-center md:py-44">
      <div className="mx-auto w-[min(300px,56vw)]">
        <Scarf3D progress={scrollYProgress} />
      </div>

      <p className="mt-20 font-body text-[12px] font-medium uppercase tracking-[0.55em] text-white/70 md:mt-28">Manifeste</p>
      <h2 id="manifeste-title" className="sr-only">
        Le manifeste des Dames du Parc
      </h2>

      <p className="sr-only">{manifesto.text}</p>
      <p aria-hidden className="mx-auto mt-10 max-w-[92vw] font-serif text-[clamp(20px,5.4vw,28px)] uppercase leading-[1.28] tracking-[0.01em] text-white md:mt-14 md:max-w-[30vw] md:text-[clamp(15px,1.5vw,26px)]">
        {typed}
        {typingNow && <span className="ml-1 inline-block h-[0.9em] w-[3px] translate-y-[0.1em] animate-pulse bg-psg-red-bright" />}
        <span className="text-transparent">{rest}</span>
      </p>
    </section>
  );
}
