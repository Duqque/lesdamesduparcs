"use client";

import Image from "next/image";
import { motion, type MotionStyle, type MotionValue } from "framer-motion";
import { QrCode } from "./QrCode";

const EDGE_LAYERS = [-1.65, -1.1, -0.55, 0, 0.55, 1.1, 1.65];

export interface CardMotion {
  /** rotations appliquées à l'objet 3D (la carte ne change jamais de place) */
  card: MotionStyle;
  identity: MotionValue<number>;
  wordmark: MotionValue<number>;
  qr: MotionValue<number>;
  newsletter: MotionValue<number>;
}

interface Props {
  motion: CardMotion;
  name: string;
  season: string;
  number: string;
  qrValue: string;
}

/** Carte membre en CSS 3D : faces, épaisseur, couches de profondeur et reflets. Le mouvement vient de l'extérieur. */
export function CardObject({ motion: m, name, season, number, qrValue }: Props) {
  return (
    <div className="relative aspect-[1.6] w-[var(--cw)] [container-type:inline-size] [perspective:1300px]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-[10%] -bottom-[9%] h-[10%] rounded-[50%] bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0.9),transparent_70%)] opacity-60 blur-[18px]"
      />
      <motion.div
        role="img"
        aria-label="Carte membre des Dames du Parc"
        style={m.card}
        className="absolute inset-0 [transform-style:preserve-3d]"
      >
        {EDGE_LAYERS.map((z) => (
          <div key={z} aria-hidden className="card-radius absolute inset-0 border border-white/25 bg-[#0a1220]" style={{ transform: `translateZ(${z}px)` }} />
        ))}

        {/* RECTO */}
        <div className="card3d-face absolute inset-0 [transform-style:preserve-3d]" style={{ transform: "translateZ(2px)" }}>
          <div className="card-radius absolute inset-0 overflow-hidden bg-[linear-gradient(135deg,#0e1c36_0%,#070f1f_38%,#03070f_100%)] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.22),inset_0_1px_0_rgba(255,255,255,0.55)]">
            <div
              aria-hidden
              className="absolute inset-0 bg-[linear-gradient(115deg,transparent_18%,rgba(140,170,220,0.13)_30%,transparent_42%),linear-gradient(115deg,transparent_58%,rgba(120,150,210,0.09)_70%,transparent_78%)]"
            />
            <motion.div
              aria-hidden
              style={{ opacity: m.qr }}
              className="absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.14)_0%,rgba(255,255,255,0.02)_38%,transparent_60%)]"
            />
            <div aria-hidden className="card3d-spec absolute inset-0" />
            <div aria-hidden className="card-grain absolute inset-0" />
          </div>

          <Image
            src="/logos/card-logo-color.webp"
            alt=""
            width={480}
            height={480}
            sizes="(min-width: 768px) 260px, 34vw"
            priority
            className="absolute left-1/2 top-[41%] w-[36.5cqw] -translate-x-1/2 -translate-y-1/2 rounded-full drop-shadow-[0_1.2cqw_1.6cqw_rgba(0,0,0,0.55)]"
            style={{ transform: "translateZ(16px)" }}
            draggable={false}
          />

          <motion.p
            style={{ opacity: m.wordmark, z: 10 }}
            className="absolute inset-x-0 top-[80%] -translate-y-1/2 text-center font-body text-[3cqw] font-light uppercase tracking-[0.42em] text-white/90"
          >
            Les Dames du Parc
          </motion.p>
          <motion.span
            aria-hidden
            style={{ opacity: m.wordmark, z: 6 }}
            className="absolute left-1/2 top-[88%] h-[0.28cqw] w-[20cqw] -translate-x-1/2 bg-[linear-gradient(90deg,transparent,#e5142f,transparent)] shadow-[0_0_1.4cqw_rgba(229,20,47,0.6)]"
          />

          {/* Identité imprimée sur la carte */}
          <motion.div style={{ opacity: m.identity, z: 10 }} className="absolute bottom-[7%] left-[6%]">
            <p className="font-body text-[1.9cqw] font-light uppercase tracking-[0.34em] text-white/70">Membre {season}</p>
            <p className="mt-[1.2cqw] font-body text-[5.6cqw] font-semibold uppercase leading-none tracking-[0.1em] text-white">{name}</p>
            <p className="mt-[1.2cqw] font-body text-[2.1cqw] font-light tabular-nums tracking-[0.3em] text-white/80">{number}</p>
          </motion.div>
          <motion.div style={{ opacity: m.qr, z: 14 }} className="absolute bottom-[7%] right-[5.5%] w-[15cqw] rounded-[1cqw] shadow-[0_1.4cqw_2.4cqw_rgba(0,0,0,0.5)]">
            <QrCode value={qrValue} className="block w-full" />
          </motion.div>
        </div>

        {/* VERSO */}
        <div className="card3d-face absolute inset-0 [transform-style:preserve-3d]" style={{ transform: "rotateY(180deg) translateZ(2px)" }}>
          <div className="card-radius absolute inset-0 overflow-hidden bg-[linear-gradient(120deg,#12213b_0%,#08111f_36%,#03070f_100%)] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.22),inset_0_1px_0_rgba(255,255,255,0.55)]">
            <div aria-hidden className="absolute inset-0 bg-[linear-gradient(105deg,rgba(150,180,230,0.28)_0%,transparent_34%)]" />
            <div aria-hidden className="absolute inset-x-0 top-[11.5%] h-[19%] bg-[#030406] shadow-[0_0_0_1px_rgba(255,255,255,0.03)]" />
            <div aria-hidden className="card3d-spec-back absolute inset-0" />
            <div aria-hidden className="card-grain absolute inset-0" />
          </div>
          <Image
            src="/logos/card-logo-silver.webp"
            alt=""
            width={400}
            height={400}
            sizes="180px"
            className="absolute left-1/2 top-[69%] w-[20cqw] -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{ transform: "translateZ(12px)" }}
            draggable={false}
          />
          <p
            className="absolute inset-x-0 top-[41%] -translate-y-1/2 text-center font-body text-[3cqw] font-medium tabular-nums tracking-[0.22em] text-white/90"
            style={{ transform: "translateZ(8px)" }}
          >
            {number}
          </p>
          <p
            className="absolute inset-x-0 top-[91%] -translate-y-1/2 text-center font-body text-[2.1cqw] font-light lowercase tracking-[0.3em] text-white/85"
            style={{ transform: "translateZ(8px)" }}
          >
            www.lesdamesduparc.com
          </p>

          {/* Verso devenu interface : newsletter */}
          <motion.div
            style={{ opacity: m.newsletter, z: 18 }}
            className="card-radius absolute inset-[3%] flex flex-col justify-center bg-[linear-gradient(135deg,#0c1a33,#050b18)] px-[7%] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.14)]"
          >
            <p className="font-body text-[1.9cqw] font-medium uppercase tracking-[0.4em] text-psg-red-bright">Dames du Parc</p>
            <p className="mt-[1.6cqw] font-display text-[5cqw] uppercase leading-none tracking-[0.02em] text-white">Espace privé</p>
            <p className="mt-[2cqw] max-w-[70%] font-body text-[2.6cqw] leading-snug text-white/75">Annonces, événements et échanges réservés aux membres.</p>
            <span className="mt-[3cqw] w-fit border border-white/45 px-[2.4cqw] py-[1.2cqw] font-body text-[1.9cqw] font-semibold uppercase tracking-[0.16em] text-white">
              Rejoindre l’espace →
            </span>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
