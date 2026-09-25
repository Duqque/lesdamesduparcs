"use client";

import Image from "next/image";
import { motion, useMotionValue, useSpring, useReducedMotion } from "framer-motion";
import { useEffect } from "react";
import { useIntroDone } from "@/lib/intro";

export function HeroBackdrop() {
  const reduce = useReducedMotion();
  const introDone = useIntroDone();
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const x = useSpring(mx, { stiffness: 55, damping: 18, mass: 0.6 });
  const y = useSpring(my, { stiffness: 55, damping: 18, mass: 0.6 });

  useEffect(() => {
    if (reduce || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    const onMove = (e: PointerEvent) => {
      mx.set((e.clientX / window.innerWidth - 0.5) * -22);
      my.set((e.clientY / window.innerHeight - 0.5) * -14);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [reduce, mx, my]);

  return (
    <div className="absolute inset-0 overflow-hidden xl:left-auto xl:w-[82%]" aria-hidden>
      <motion.div
        className="absolute inset-[-4%]"
        style={{ x, y }}
        initial={reduce ? false : { scale: 1.16, opacity: 0 }}
        animate={introDone ? { scale: 1.04, opacity: 1 } : { scale: 1.16, opacity: 0 }}
        transition={{ duration: 1.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
      >
        <Image
          src="/images/fans-drapeau-fumigene.webp"
          alt=""
          fill
          priority
          sizes="(min-width: 1280px) 80vw, 100vw"
          className="object-cover object-[68%_30%] xl:object-[50%_35%]"
        />
      </motion.div>
    </div>
  );
}
