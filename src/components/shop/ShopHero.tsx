"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { heroSlides } from "@/data/shop";
import { cn } from "@/lib/cn";

const DURATION = 6500;

/** Vitrine : grande carte arrondie, texte en bas à gauche, liste numérotée 01 à 05 avec barre de progression. */
export function ShopHero() {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const slide = heroSlides[i];

  useEffect(() => {
    if (paused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = window.setTimeout(() => setI((n) => (n + 1) % heroSlides.length), DURATION);
    return () => window.clearTimeout(t);
  }, [i, paused]);

  return (
    <section aria-roledescription="carrousel" aria-label="À la une de la boutique" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} className="relative isolate overflow-hidden rounded-[clamp(20px,2.4vw,32px)] bg-night-900">
      <div className="relative min-h-[clamp(520px,78svh,760px)]">
        <AnimatePresence mode="sync">
          <motion.div key={slide.id} className="absolute inset-0" initial={{ opacity: 0, scale: 1.06 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}>
            <Image src={slide.image} alt="" fill priority={i === 0} sizes="100vw" className="object-cover object-[50%_18%]" />
          </motion.div>
        </AnimatePresence>
        <div aria-hidden className="absolute inset-0 bg-[linear-gradient(180deg,rgba(3,9,25,0.15)_0%,rgba(3,9,25,0.35)_45%,rgba(3,9,25,0.92)_100%),linear-gradient(90deg,rgba(3,9,25,0.6)_0%,transparent_60%)]" />

        <div className="absolute inset-x-0 bottom-0 px-[clamp(20px,4vw,64px)] pb-8 md:pb-10">
          <AnimatePresence mode="wait">
            <motion.div key={slide.id} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }} aria-live="polite">
              <h2 className="max-w-[16ch] t-display">{slide.title}</h2>
              <p className="mt-5 max-w-md text-white/80 t-lead">{slide.text}</p>
              <Link href={slide.href} className="group mt-7 inline-flex h-12 items-center gap-4 rounded-full bg-white pl-6 pr-1.5 font-body text-[14.5px] font-medium text-night-950">
                Découvrir
                <span className="grid size-9 place-items-center rounded-full bg-night-950 text-white transition-transform duration-300 group-hover:translate-x-0.5">
                  <ArrowRight aria-hidden className="size-4" />
                </span>
              </Link>
            </motion.div>
          </AnimatePresence>

          <ol className="mt-10 hidden grid-cols-5 gap-6 border-t border-white/15 pt-0 md:grid">
            {heroSlides.map((s, n) => (
              <li key={s.id}>
                <button type="button" onClick={() => setI(n)} aria-current={n === i} className="relative block w-full pt-5 text-left">
                  <span aria-hidden className="absolute -top-px left-0 h-[2px] w-full bg-transparent">
                    {n === i && <span key={`${i}-${paused}`} className={cn("block h-full origin-left bg-white", !paused && "animate-[shop-progress_6.5s_linear_forwards]")} />}
                  </span>
                  <span className={cn("block font-display text-[22px] font-semibold tabular-nums", n === i ? "text-white" : "text-white/45")}>{s.index}</span>
                  <span className={cn("mt-1 block font-body text-[12px] leading-snug", n === i ? "text-white/90" : "text-white/40")}>{s.label}</span>
                </button>
              </li>
            ))}
          </ol>
          <div className="mt-8 flex justify-center gap-2 md:hidden">
            {heroSlides.map((s, n) => (
              <button key={s.id} type="button" onClick={() => setI(n)} aria-label={`Diapositive ${s.index}`} aria-current={n === i} className="grid size-6 place-items-center">
                <span className={cn("block h-[3px] rounded-full transition-all", n === i ? "w-8 bg-white" : "w-4 bg-white/35")} />
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
