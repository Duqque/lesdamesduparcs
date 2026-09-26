"use client";

import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import Image from "next/image";
import { ChevronDown } from "lucide-react";
import { HeroBackdrop } from "./HeroBackdrop";
import { HeroContent } from "./HeroContent";

/**
 * Première rubrique : exactement la hauteur de l'écran, textes en bas à gauche, menu transparent superposé à la photo.
 * En descendant, la photo se rapproche et s'assombrit, les textes glissent vers le haut et s'effacent : la page « entre » dans le
 * manifeste juste en dessous (le bouton en bas de l'écran y mène en douceur).
 */
export function Hero({ title, subtitle, cta, image, imageAlt }: { title?: string; subtitle?: string; cta?: string; image?: string; imageAlt?: string }) {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const photoScale = useTransform(scrollYProgress, [0, 1], [1, reduce ? 1 : 1.14]);
  const veil = useTransform(scrollYProgress, [0, 0.9], [0, 0.92]);
  const textY = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : -140]);
  const textOpacity = useTransform(scrollYProgress, [0, 0.55], [1, 0]);
  // Logo d'origine, en haut de l'écran sur mobile et tablette : il s'efface dès les premiers pixels de défilement.
  const logoOpacity = useTransform(scrollYProgress, [0, 0.1], [1, 0]);
  const cueOpacity = useTransform(scrollYProgress, [0, 0.15], [1, 0]);

  const goToManifesto = () => document.getElementById("manifeste")?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });

  return (
    <section
      ref={ref}
      aria-labelledby="hero-title"
      className="grain vignette relative flex h-[100svh] max-h-[100svh] items-end overflow-hidden bg-night-950"
    >
      <motion.div className="absolute inset-0 origin-center" style={{ scale: photoScale }}>
        <HeroBackdrop src={image || undefined} alt={imageAlt} />
      </motion.div>
      <div
        aria-hidden
        className="absolute inset-0 z-[1] bg-[linear-gradient(0deg,rgba(3,9,25,0.94)_0%,rgba(3,9,25,0.6)_26%,rgba(3,9,25,0)_58%),linear-gradient(90deg,rgba(3,9,25,0.78)_0%,rgba(3,9,25,0.35)_38%,rgba(3,9,25,0)_70%),linear-gradient(180deg,rgba(3,9,25,0.62)_0%,rgba(3,9,25,0)_20%)]"
      />
      <motion.div aria-hidden className="absolute inset-0 z-[2] bg-night-950" style={{ opacity: veil }} />
      <motion.div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 z-10 flex justify-center pt-[max(20px,env(safe-area-inset-top))] lg:hidden" style={{ opacity: logoOpacity }}>
        <Image src="/logos/dames-du-parc-logo.webp" alt="" width={120} height={120} priority className="size-[88px] drop-shadow-[0_8px_24px_rgba(0,0,0,0.55)] sm:size-[104px]" />
      </motion.div>
      <motion.div className="relative z-10 flex w-full items-end" style={{ y: textY, opacity: textOpacity }}>
        <HeroContent title={title} subtitle={subtitle} cta={cta} />
      </motion.div>

      <motion.button
        type="button"
        onClick={goToManifesto}
        aria-label="Passer au manifeste"
        style={{ opacity: cueOpacity }}
        className="absolute bottom-[104px] right-5 z-10 flex flex-col items-center gap-2 font-body text-[12px] font-medium uppercase tracking-[0.28em] text-white/75 transition-colors hover:text-white lg:bottom-8 lg:left-1/2 lg:right-auto lg:-translate-x-1/2"
      >
        <span className="hidden lg:block">Découvrir</span>
        <motion.span
          aria-hidden
          animate={reduce ? undefined : { y: [0, 8, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          className="grid size-11 place-items-center rounded-full border border-white/25 bg-night-950/40 backdrop-blur-sm"
        >
          <ChevronDown className="size-5" strokeWidth={1.7} />
        </motion.span>
      </motion.button>
    </section>
  );
}
