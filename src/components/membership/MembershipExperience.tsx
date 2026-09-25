"use client";

import {
  motion,
  useAnimationFrame,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type MotionStyle,
} from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useIntroDone } from "@/lib/intro";
import { cn } from "@/lib/cn";
import { CardObject, type CardMotion } from "./CardObject";
import { POSE, useTrack } from "./pose";
import {
  AgendaScene,
  BenefitsScene,
  CommunityScene,
  FlipScene,
  IdentityScene,
  IntroScene,
  NewsletterScene,
  PriceScene,
  ScrollHint,
  StoryScene,
  VirtualScene,
} from "./Scenes";

const STEPS = [
  { at: 0, name: "La carte" },
  { at: 0.2, name: "Identité" },
  { at: 0.42, name: "Avantages" },
  { at: 0.58, name: "Événements" },
  { at: 0.7, name: "Newsletter" },
  { at: 0.81, name: "Carte virtuelle" },
  { at: 0.89, name: "Communauté" },
  { at: 0.945, name: "Rejoindre" },
];

interface Props {
  name: string;
  since: string;
  number: string;
  season: string;
  qrValue: string;
}

export function MembershipExperience({ name, since, number, season, qrValue }: Props) {
  const reduce = useReducedMotion();
  const introDone = useIntroDone();
  const containerRef = useRef<HTMLElement>(null);
  const [step, setStep] = useState(0);

  const { scrollYProgress } = useScroll({ target: containerRef, offset: ["start start", "end end"] });
  const smooth = useSpring(scrollYProgress, { stiffness: 90, damping: 28, mass: 0.5, restDelta: 0.0004 });
  const p = reduce ? scrollYProgress : smooth;

  useMotionValueEvent(p, "change", (v) => {
    let idx = 0;
    STEPS.forEach((s, i) => {
      if (v >= s.at) idx = i;
    });
    setStep((prev) => (prev === idx ? prev : idx));
  });

  const desk = useMotionValue(1);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const mxS = useSpring(mx, { stiffness: 60, damping: 18 });
  const myS = useSpring(my, { stiffness: 60, damping: 18 });
  const t = useMotionValue(0);

  useAnimationFrame((time) => {
    if (!reduce) t.set(time / 1000);
  });

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const sync = () => desk.set(mq.matches ? 1 : 0);
    sync();
    mq.addEventListener("change", sync);
    if (reduce || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return () => mq.removeEventListener("change", sync);
    const onMove = (e: PointerEvent) => {
      mx.set((e.clientX / window.innerWidth - 0.5) * 2);
      my.set((e.clientY / window.innerHeight - 0.5) * 2);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      mq.removeEventListener("change", sync);
      window.removeEventListener("pointermove", onMove);
    };
  }, [desk, mx, my, reduce]);

  /* Pose de la carte : rotations seules (la carte ne change jamais de place), scroll = moteur, souris = vie */
  const ryTrack = useTrack(p, POSE.ry);
  const rxTrack = useTrack(p, POSE.rx);
  const rzTrack = useTrack(p, POSE.rz);

  const rotateY = useTransform([ryTrack, mxS, desk, t], ([a, m, k, tt]) => (a as number) + (m as number) * 4 * (k as number) + Math.cos(((tt as number) * 2 * Math.PI) / 11) * 0.6);
  const rotateX = useTransform([rxTrack, myS, desk, t], ([a, m, k, tt]) => (a as number) + (m as number) * 3 * (k as number) + Math.sin(((tt as number) * 2 * Math.PI) / 9) * 0.5);
  const rotateZ = useTransform([rzTrack, t], ([a, tt]) => (a as number) + Math.sin(((tt as number) * 2 * Math.PI) / 13) * 0.4);

  const lx = useTransform(rotateY, (v) => `${50 - Math.sin((v * Math.PI) / 180) * 42}%`);
  const lxb = useTransform(rotateY, (v) => `${50 + Math.sin((v * Math.PI) / 180) * 42}%`);
  const ly = useTransform(rotateX, (v) => `${42 - Math.sin((v * Math.PI) / 180) * 40}%`);

  const identity = useTransform(p, [0, 0.2, 0.24, 0.32, 0.35, 0.8, 0.83, 0.93, 0.95, 1], [0, 0, 1, 1, 0, 0, 1, 1, 0, 0]);
  const wordmark = useTransform(identity, (v) => 1 - v);
  const qr = useTransform(p, [0, 0.83, 0.865, 0.93, 0.95, 1], [0, 0, 1, 1, 0, 0]);
  const newsletter = useTransform(p, [0, 0.72, 0.75, 0.79, 0.82, 1], [0, 0, 1, 1, 0, 0]);

  const cardMotion: CardMotion = {
    card: { rotateX, rotateY, rotateZ, "--lx": lx, "--lxb": lxb, "--ly": ly, "--li": 0.13 } as MotionStyle,
    identity,
    wordmark,
    qr,
    newsletter,
  };

  const goldGlow = useTransform(p, [0.8, 0.85, 0.9, 0.93], [0, 1, 1, 0]);
  const finalDim = useTransform(p, [0.94, 0.985], [0, 0.4]);

  return (
    <section ref={containerRef} aria-label="Expérience carte membre" className="relative h-[1000svh] md:h-[1200svh]">
      <div className="card-stage sticky top-0 h-svh w-full overflow-hidden bg-night-950 [perspective:1600px]">
        <div aria-hidden className="absolute inset-0 bg-[radial-gradient(ellipse_65%_55%_at_50%_50%,rgba(26,52,112,0.42),transparent_72%)]" />
        <motion.div aria-hidden style={{ opacity: goldGlow }} className="absolute inset-0 bg-[radial-gradient(ellipse_55%_45%_at_50%_50%,rgba(245,197,66,0.16),transparent_70%)]" />
        <motion.div aria-hidden style={{ opacity: finalDim }} className="absolute inset-0 bg-night-950" />

        <div className="absolute inset-0 z-[2] grid place-items-center">
          <motion.div
            initial={reduce ? false : { opacity: 0, scale: 0.94 }}
            animate={introDone ? { opacity: 1, scale: 1 } : undefined}
            transition={{ duration: 1.3, ease: [0.16, 1, 0.3, 1] }}
          >
            <CardObject motion={cardMotion} name={name} season={season} number={number} qrValue={qrValue} />
          </motion.div>
        </div>

        <IntroScene p={p} desk={desk} />
        <ScrollHint p={p} desk={desk} />
        <StoryScene p={p} desk={desk} />
        <IdentityScene p={p} desk={desk} name={name} since={since} number={number} season={season} />
        <FlipScene p={p} desk={desk} />
        <BenefitsScene p={p} desk={desk} />
        <AgendaScene p={p} desk={desk} />
        <NewsletterScene p={p} desk={desk} />
        <VirtualScene p={p} desk={desk} />
        <CommunityScene p={p} desk={desk} />
        <PriceScene p={p} desk={desk} />

        <ol aria-label="Progression" className="pointer-events-none absolute right-[1.2vw] top-1/2 z-[5] hidden -translate-y-1/2 flex-col gap-3 md:flex">
          {STEPS.map((s, i) => (
            <li key={s.name} aria-current={i === step ? "step" : undefined} aria-label={`${i + 1}. ${s.name}`}>
              <span className={cn("block h-px transition-[width,background-color] duration-500", i === step ? "w-8 bg-psg-red-bright" : "w-3 bg-white/35")} />
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
