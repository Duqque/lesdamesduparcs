"use client";

import { motion, useAnimationFrame, useMotionValue, useReducedMotion, useSpring, useTransform, type MotionValue } from "framer-motion";
import { useEffect, useRef } from "react";

const STRIPS = 30;
const SRC = "/images/echarpe-fiere-parisienne.webp";
const RATIO = 1600 / 258;

/**
 * Écharpe en 3D : dépliée par le scroll (progress 0 → 1), ondulation d'étoffe par tranches verticales,
 * inclinaison douce vers la souris. Le tissu ne se déforme jamais au point de casser l'image.
 */
export function Scarf3D({ progress }: { progress: MotionValue<number> }) {
  const reduce = useReducedMotion();
  const stripRefs = useRef<Array<HTMLDivElement | null>>([]);
  const amp = useMotionValue(0);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const mxS = useSpring(mx, { stiffness: 60, damping: 18 });
  const myS = useSpring(my, { stiffness: 60, damping: 18 });

  useEffect(() => {
    if (reduce || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    const onMove = (e: PointerEvent) => {
      mx.set((e.clientX / window.innerWidth - 0.5) * 2);
      my.set((e.clientY / window.innerHeight - 0.5) * 2);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [reduce, mx, my]);

  const p = useSpring(progress, { stiffness: 90, damping: 26, mass: 0.5 });
  const rotateY = useTransform([p, mxS], ([v, m]) => -48 * (1 - (v as number)) + (m as number) * 6);
  const rotateX = useTransform([p, myS], ([v, m]) => 22 * (1 - (v as number)) + 6 - (m as number) * 4);
  const rotateZ = useTransform(p, (v) => -6 * (1 - v) - 1.2);
  const scale = useTransform(p, (v) => 0.78 + 0.22 * v);
  const opacity = useTransform(p, [0, 0.25], [0, 1]);
  const shadowOpacity = useTransform(p, [0, 1], [0.15, 0.55]);

  useAnimationFrame((time) => {
    const t = reduce ? 0 : time / 1000;
    const a = 0.3 + 0.7 * p.get();
    amp.set(a);
    stripRefs.current.forEach((el, i) => {
      if (!el) return;
      const ph = t * 1.35 + i * 0.42;
      const z = Math.sin(ph) * 15 * a;
      const ry = Math.cos(ph) * 5.5 * a;
      el.style.transform = `translateZ(${z.toFixed(2)}px) rotateY(${ry.toFixed(2)}deg)`;
    });
  });

  return (
    <div className="relative mx-auto w-full [perspective:1500px]" style={{ aspectRatio: RATIO }}>
      <motion.div
        aria-hidden
        style={{ opacity: shadowOpacity }}
        className="pointer-events-none absolute inset-x-[6%] -bottom-[14%] h-[26%] rounded-[50%] bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0.85),transparent_70%)] blur-[22px]"
      />
      <motion.div role="img" aria-label="Écharpe des Dames du Parc : Fière d'être parisienne" style={{ rotateX, rotateY, rotateZ, scale, opacity }} className="absolute inset-0 [transform-style:preserve-3d]">
        {Array.from({ length: STRIPS }, (_, i) => (
          <div
            key={i}
            ref={(el) => {
              stripRefs.current[i] = el;
            }}
            className="absolute inset-y-0 will-change-transform"
            style={{
              left: `${(i / STRIPS) * 100}%`,
              width: `calc(${100 / STRIPS}% + 1.5px)`,
              backgroundImage: `url(${SRC})`,
              backgroundSize: `${STRIPS * 100}% 100%`,
              backgroundPosition: `${(i / (STRIPS - 1)) * 100}% 0`,
              backgroundRepeat: "no-repeat",
            }}
          />
        ))}
      </motion.div>
    </div>
  );
}
