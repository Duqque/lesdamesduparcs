"use client";

import Image from "next/image";
import { motion, useAnimationFrame, useMotionValue, useReducedMotion, useScroll, useSpring, useTransform, type MotionStyle } from "framer-motion";
import { useEffect, useRef, type RefObject } from "react";

const LAYERS = 16;
const HALF_DEPTH = 7;

interface Props {
  /** Élément dont la traversée à l'écran pilote la rotation liée au scroll */
  scrollTarget: RefObject<HTMLElement | null>;
}

/** Médaillon 3D du logo : épaisseur réelle, reflet spéculaire, inertie à la souris, dérive lente et rotation au scroll. */
export function Logo3D({ scrollTarget }: Props) {
  const reduce = useReducedMotion();
  const boxRef = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const mxS = useSpring(mx, { stiffness: 55, damping: 16 });
  const myS = useSpring(my, { stiffness: 55, damping: 16 });
  const spin = useSpring(useMotionValue(0), { stiffness: 60, damping: 14, mass: 0.8 });
  const t = useMotionValue(0);

  const { scrollYProgress } = useScroll({ target: scrollTarget, offset: ["start start", "end start"] });
  const scrollSpin = useSpring(scrollYProgress, { stiffness: 80, damping: 26, mass: 0.5 });

  useAnimationFrame((time) => {
    if (!reduce) t.set(time / 1000);
  });

  useEffect(() => {
    if (reduce || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    const onMove = (e: PointerEvent) => {
      const r = boxRef.current?.getBoundingClientRect();
      if (!r) return;
      mx.set(Math.max(-1, Math.min(1, (e.clientX - (r.left + r.width / 2)) / (window.innerWidth * 0.5))));
      my.set(Math.max(-1, Math.min(1, (e.clientY - (r.top + r.height / 2)) / (window.innerHeight * 0.5))));
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [reduce, mx, my]);

  const rotateY = useTransform([t, mxS, scrollSpin, spin], ([tt, m, s, sp]) => Math.sin((tt as number) * 0.55) * 16 + (m as number) * 20 + (s as number) * 300 + (sp as number));
  const rotateX = useTransform([t, myS], ([tt, m]) => Math.cos((tt as number) * 0.4) * 5 + (m as number) * 12);
  const rotateZ = useTransform(t, (tt) => Math.sin(tt * 0.3) * 2);
  const floatY = useTransform(t, (tt) => Math.sin(tt * 0.9) * 8);

  const lx = useTransform(rotateY, (v) => `${50 - Math.sin((v * Math.PI) / 180) * 45}%`);
  const lxb = useTransform(rotateY, (v) => `${50 + Math.sin((v * Math.PI) / 180) * 45}%`);
  const ly = useTransform(rotateX, (v) => `${40 - Math.sin((v * Math.PI) / 180) * 40}%`);
  const shadowScale = useTransform(floatY, (f) => 0.9 + ((f + 8) / 16) * 0.12);
  const shadowOpacity = useTransform(floatY, (f) => 0.5 + ((f + 8) / 16) * 0.2);

  const cardStyle = { rotateX, rotateY, rotateZ, "--lx": lx, "--lxb": lxb, "--ly": ly } as MotionStyle;
  const bobStyle: MotionStyle = { y: floatY };

  const spinOnce = () => spin.set(spin.get() + 360);

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
      className="relative"
    >
      <div
        ref={boxRef}
        onClick={spinOnce}
        data-cursor="view"
        className="relative mx-auto aspect-square w-[min(72vw,440px,56svh)] cursor-pointer select-none [perspective:1200px] md:w-[min(34vw,480px,68svh)]"
      >
        <motion.div
          aria-hidden
          style={{ opacity: shadowOpacity, scaleX: shadowScale }}
          className="pointer-events-none absolute inset-x-[14%] -bottom-[10%] h-[9%] rounded-[50%] bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0.85),transparent_70%)] blur-[16px]"
        />
        <motion.div style={bobStyle} className="absolute inset-0">
          <motion.div role="img" aria-label="Logo des Dames du Parc" style={cardStyle} className="absolute inset-0 [transform-style:preserve-3d]">
            {Array.from({ length: LAYERS }, (_, i) => {
              const z = -HALF_DEPTH + (i / (LAYERS - 1)) * HALF_DEPTH * 2;
              return (
                <div
                  key={i}
                  aria-hidden
                  className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_30%_25%,#1a2b52,#0a1430_70%)] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.18)]"
                  style={{ transform: `translateZ(${z}px)` }}
                />
              );
            })}

            <div className="logo3d-face absolute inset-0 [transform-style:preserve-3d]" style={{ transform: `translateZ(${HALF_DEPTH + 1}px)` }}>
              <Image src="/logos/dames-du-parc-logo.webp" alt="" width={512} height={512} priority sizes="(min-width: 768px) 480px, 72vw" className="absolute inset-0 size-full rounded-full" draggable={false} />
              <div aria-hidden className="logo3d-spec absolute inset-0 rounded-full" />
            </div>
            <div className="logo3d-face absolute inset-0 [transform-style:preserve-3d]" style={{ transform: `rotateY(180deg) translateZ(${HALF_DEPTH + 1}px)` }}>
              <Image src="/logos/dames-du-parc-logo.webp" alt="" width={512} height={512} sizes="(min-width: 768px) 480px, 72vw" className="absolute inset-0 size-full rounded-full" draggable={false} />
              <div aria-hidden className="logo3d-spec-back absolute inset-0 rounded-full" />
            </div>
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
}
