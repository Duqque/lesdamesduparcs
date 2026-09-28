"use client";

import { useMotionValueEvent, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { useEffect, useRef } from "react";
import { manifesto } from "@/data/manifesto";

/** Manifeste : grand texte centré écrit lettre par lettre au fil du scroll, précédé d'un grand espace vide. */
export function Manifesto({ text: custom }: { text?: string }) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLElement>(null);
  const typedRef = useRef<HTMLSpanElement>(null);
  const restRef = useRef<HTMLSpanElement>(null);
  const caretRef = useRef<HTMLSpanElement>(null);
  const shownRef = useRef(-1);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 85%", "center 38%"] });
  const typing = useTransform(scrollYProgress, [0.1, 0.95], [0, 1], { clamp: true });
  const text = custom?.trim() || manifesto.text;
  const total = text.length;

  // Écriture lettre par lettre directement dans le DOM : aucune mise à jour React à chaque défilement (fluidité).
  const paint = (v: number) => {
    const n = reduce ? total : Math.round(v * total);
    if (n === shownRef.current || !typedRef.current || !restRef.current) return;
    shownRef.current = n;
    typedRef.current.textContent = text.slice(0, n);
    restRef.current.textContent = text.slice(n);
    if (caretRef.current) caretRef.current.style.display = n > 0 && n < total ? "inline-block" : "none";
  };
  useMotionValueEvent(typing, "change", paint);
  useEffect(() => paint(typing.get()), [reduce]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <section ref={ref} id="manifeste" aria-labelledby="manifeste-title" className="mx-auto max-w-[1200px] px-[var(--gutter)] py-28 text-center md:py-44">
      <div aria-hidden className="h-24 md:h-44" />

      <p className="font-body text-[12px] font-medium uppercase tracking-[0.55em] text-white/70">Manifeste</p>
      <h2 id="manifeste-title" className="sr-only">
        Le manifeste des Dames du Parc
      </h2>

      <p className="sr-only">{text}</p>
      <p aria-hidden className="mx-auto mt-10 max-w-[92vw] font-serif text-[clamp(20px,5.4vw,28px)] uppercase leading-[1.28] tracking-[0.01em] text-white md:mt-14 md:max-w-[30vw] md:text-[clamp(15px,1.5vw,26px)]">
        <span ref={typedRef} />
        <span ref={caretRef} style={{ display: "none" }} className="ml-1 h-[0.9em] w-[3px] translate-y-[0.1em] animate-pulse bg-psg-red-bright" />
        <span ref={restRef} className="text-transparent">{text}</span>
      </p>
    </section>
  );
}
