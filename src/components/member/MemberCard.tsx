"use client";

import { useState } from "react";
import { motion, useMotionValue, useSpring, type MotionStyle } from "framer-motion";
import { RotateCw } from "lucide-react";
import { CardObject, type CardMotion } from "@/components/membership/CardObject";
import { QrCode } from "@/components/membership/QrCode";

/** Carte membre personnalisée, à retourner : recto (identité + QR) et verso. */
export function MemberCard({ name, season, number, qrValue, state = "active" }: { name: string; season: string; number: string; qrValue: string; state?: "active" | "pending" | "expired" | "none" | "suspended" | "expelled" }) {
  const valid = state === "active";
  const note = state === "pending" || state === "none" ? "Carte en cours de création" : state === "suspended" ? "Adhésion suspendue" : state === "expelled" ? "Adhésion radiée" : "Adhésion terminée";
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
      {!valid && (
        <p role="status" className="rounded-full border border-amber-400/40 bg-amber-400/10 px-5 py-2 text-center font-body text-[13px] font-semibold uppercase tracking-[0.16em] text-amber-100">
          {note}
          <span className="mt-1 block text-[12px] font-normal normal-case tracking-normal text-amber-100/85">
            {state === "pending" || state === "none" ? "Elle sera validée dès la réception du paiement. D’ici là, son QR code indique « Adhésion invalide »." : "Son QR code indique que l’adhésion n’est pas valide."}
          </span>
        </p>
      )}
      <div className={valid ? "w-full [--cw:min(100%,480px)]" : "w-full opacity-70 saturate-50 [--cw:min(100%,480px)]"}>
        <motion.div className="mx-auto w-[var(--cw)] [perspective:1600px]">
          <CardObject motion={m} name={name} season={season} number={number} qrValue={qrValue} />
        </motion.div>
      </div>
      {/* QR code : sous la carte (il n'est plus imprimé dessus) ; « Adhésion invalide » tant que le paiement n'est pas validé. */}
      <figure className="flex flex-col items-center gap-3">
        <div className={valid ? "rounded-[12px] bg-white p-2.5 shadow-[0_18px_40px_-20px_rgba(0,0,0,0.8)]" : "rounded-[12px] bg-white p-2.5 opacity-50"}>
          <QrCode value={qrValue} className="block size-[148px]" />
        </div>
        <figcaption className="max-w-[300px] text-center font-body text-[13px] leading-[1.5] text-mist">
          {valid ? "Scannez pour vérifier l’adhésion." : "Adhésion invalide tant que le paiement n’est pas validé."}
        </figcaption>
      </figure>
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
