"use client";

import { useState } from "react";
import { useMotionValue, useSpring, type MotionStyle } from "framer-motion";
import { RotateCw } from "lucide-react";
import { CardObject, type CardMotion } from "@/components/membership/CardObject";

/** Aperçu de la carte de membre : le même objet 3D que dans l'espace membre, avec des informations d'exemple, à retourner d'un clic. */
export function MemberCard({ season }: { season: string }) {
  const [flipped, setFlipped] = useState(false);
  const target = useMotionValue(-8);
  const rotateY = useSpring(target, { stiffness: 70, damping: 16 });
  const identity = useMotionValue(1);
  // Le petit bandeau « Les Dames du Parc » n'est là que pour d'autres mises en scène de la carte : affiché en même temps que
  // l'identité (nom, saison, numéro), il se superpose à elle. Cf. la vraie carte de l'espace membre, qui le garde caché ici aussi.
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
    <div className="flex flex-col items-center gap-6">
      <div className="w-full [--cw:min(100%,460px)] [perspective:1600px]">
        <CardObject motion={m} name="Camille Durand" season={season} number="EXEMPLE-LDDP2026" />
      </div>
      <p className="text-[12px] uppercase tracking-[0.2em] text-mist">Exemple de carte membre</p>
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
