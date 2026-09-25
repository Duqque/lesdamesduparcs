"use client";

import { useMotionValueEvent, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { useRef, useState } from "react";
import { manifesto } from "@/data/manifesto";
import { Scarf3D } from "./Scarf3D";

/** Manifeste : l'écharpe se déplie et le texte s'écrit lettre par lettre au fil du scroll. */
export function Manifesto() {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 92%", "center 40%"] });
  const typing = useTransform(scrollYProgress, [0.12, 0.95], [0, 1], { clamp: true });
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
    <section ref={ref} aria-labelledby="manifeste-title" className="px-[var(--gutter)] py-16 xl:pl-[var(--gutter)] xl:pr-0 xl:py-24">
      <p className="font-body text-[12px] font-semibold uppercase tracking-[0.3em] text-psg-red-bright">Manifeste</p>
      <h2 id="manifeste-title" className="sr-only">
        Le manifeste des Dames du Parc
      </h2>

      <div className="mt-10 md:mt-14">
        <Scarf3D progress={scrollYProgress} />
      </div>

      <div className="mt-14 max-w-[52rem] md:mt-20">
        <p className="sr-only">{manifesto.text}</p>
        <p aria-hidden className="font-body text-[clamp(18px,1.9vw,27px)] font-normal leading-[1.7] tracking-[-0.005em] text-white">
          {typed}
          {typingNow && <span className="ml-0.5 inline-block h-[1em] w-[2px] translate-y-[0.15em] animate-pulse bg-psg-red-bright" />}
          <span className="text-transparent">{rest}</span>
        </p>
      </div>
    </section>
  );
}
