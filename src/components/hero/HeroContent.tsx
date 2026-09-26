"use client";

import { motion, type Variants } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { useIntroDone } from "@/lib/intro";
import { JoinGate, JoinSectionGate } from "@/components/member/JoinGate";

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.13, delayChildren: 0.35 } },
};

const item: Variants = {
  hidden: { opacity: 0, y: 26, filter: "blur(8px)" },
  show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.85, ease: [0.22, 1, 0.36, 1] } },
};

export function HeroContent({ title = "Les Dames du Parc", subtitle, cta = "Rejoindre le groupe" }: { title?: string; subtitle?: string; cta?: string }) {
  const introDone = useIntroDone();
  return (
    <motion.div
      className="relative z-10 flex w-full max-w-[640px] flex-col px-[var(--gutter)] pb-12 max-lg:pb-[120px] lg:pb-14"
      variants={container}
      initial="hidden"
      animate={introDone ? "show" : "hidden"}
    >
      <h1 id="hero-title" className="flex flex-col">
        <motion.span
          variants={item}
          className="font-display text-[clamp(28px,3vw,50px)] uppercase leading-none text-white"
        >
          {title}
        </motion.span>
      </h1>
      <motion.p variants={item} className="mt-8 max-w-[28rem] font-body text-[15px] leading-[1.65] text-white/90 md:text-[16px] xl:mt-9 xl:text-[16px]">
        {subtitle ? subtitle : (
          <>
            Supporter, vibrer, partager, s&rsquo;engager.
            <br className="hidden sm:block" /> Les Dames du Parc, c&rsquo;est la passion du&nbsp;PSG
            <br className="hidden sm:block" /> au&nbsp;féminin, toute l&rsquo;année, au Parc et partout.
          </>
        )}
      </motion.p>
      <JoinSectionGate>
        <motion.div variants={item} className="mt-9 xl:mt-12">
          <JoinGate>
            <Button size="lg" href="/rejoindre-le-groupe" className="w-full sm:w-auto sm:min-w-[232px]">
              {cta}
            </Button>
          </JoinGate>
        </motion.div>
      </JoinSectionGate>
    </motion.div>
  );
}
