"use client";

import { motion, type Variants } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Scribble } from "@/components/ui/Scribble";
import { useIntroDone } from "@/lib/intro";

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.13, delayChildren: 0.35 } },
};

const item: Variants = {
  hidden: { opacity: 0, y: 26, filter: "blur(8px)" },
  show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.85, ease: [0.22, 1, 0.36, 1] } },
};

export function HeroContent() {
  const introDone = useIntroDone();
  return (
    <motion.div
      className="relative z-10 flex w-full max-w-[640px] flex-col px-[var(--gutter)] pb-9 pt-[120px] xl:pb-0 xl:pt-[clamp(140px,10.4vw,164px)]"
      variants={container}
      initial="hidden"
      animate={introDone ? "show" : "hidden"}
    >
      <h1 id="hero-title" className="flex flex-col">
        <motion.span
          variants={item}
          className="font-display text-[clamp(36px,3.2vw,54px)] font-semibold uppercase leading-none tracking-[0.085em] text-white"
        >
          Les Dames du Parc
        </motion.span>
        <motion.span
          variants={item}
          className="relative mt-3 block origin-left -rotate-[6deg] font-script text-[clamp(44px,3.85vw,66px)] font-medium leading-[0.9] text-white xl:mt-7"
        >
          Plus qu&rsquo;un groupe,
          <span className="relative ml-[0.55em] block w-fit">
            une famille.
            <Scribble className="absolute -bottom-[0.14em] left-[8%] h-[0.28em] w-[92%]" />
          </span>
        </motion.span>
      </h1>
      <motion.p variants={item} className="mt-8 max-w-[28rem] font-body text-[15px] leading-[1.65] text-white/90 md:text-[16px] xl:mt-9 xl:text-[16px]">
        Supporter, vibrer, partager, s&rsquo;engager.
        <br className="hidden sm:block" /> Les Dames du Parc, c&rsquo;est la passion du&nbsp;PSG
        <br className="hidden sm:block" /> au&nbsp;féminin, toute l&rsquo;année, au Parc et partout.
      </motion.p>
      <motion.div variants={item} className="mt-9 xl:mt-12">
        <Button size="lg" href="/communaute" className="w-full sm:w-auto sm:min-w-[232px]">
          Rejoindre le groupe
        </Button>
      </motion.div>
    </motion.div>
  );
}
