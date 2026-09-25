"use client";

import { useState } from "react";
import { motion, useMotionValue, useSpring, type MotionStyle } from "framer-motion";
import { RotateCw } from "lucide-react";
import { CardObject, type CardMotion } from "@/components/membership/CardObject";

/** Carte membre personnalisée, à retourner : recto (identité + QR) et verso. */
export function MemberCard({ name, season, number, qrValue }: { name: string; season: string; number: string; qrValue: string }) {
  const [flipped, setFlipped] = useState(false);
  const target = useMotionValue(-8);
  const rotateY = useSpring(target, { stiffness: 70, damping: 16 });
  const identity = useMotionValue(1);
  const wordmark = useMotionValue(0);
  const qr = useMotionValue(1);
  const newsletter = useMotionValue(0);

  const m: CardMotion = {
    card: { rotateY, rotateX: 4, "--lx": "50%", "--lxb": "50%", "--ly": "42%", "--li": 0.13 } as MotionStyle,
    identity,
    wordmark,
    qr,
    newsletter,
  };

  return (
    <div className="flex flex-col items-center gap-8">
      <div className="w-full [--cw:min(100%,480px)]">
        <motion.div className="mx-auto w-[var(--cw)] [perspective:1600px]">
          <CardObject motion={m} name={name} season={season} number={number} qrValue={qrValue} />
        </motion.div>
      </div>
      <button
        type="button"
        onClick={() => {
          const next = !flipped;
          setFlipped(next);
          target.set(next ? 172 : -8);
        }}
        className="inline-flex h-11 items-center gap-2.5 rounded-[10px] border border-white/[0.12] bg-[#121417]/90 px-5 font-body text-[14px] font-medium text-white hover:border-white/30"
      >
        <RotateCw aria-hidden className="size-4" strokeWidth={1.7} />
        {flipped ? "Voir le recto" : "Retourner la carte"}
      </button>
    </div>
  );
}
