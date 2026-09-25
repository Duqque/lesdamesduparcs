"use client";

import { motion } from "framer-motion";
import { ArtFrame, BLUE, CENTER, RED, ROYAL, SKY, WHITE, useArt } from "./ArtFrame";

const HEART = "M0 9 C-9 3 -10 -5 -5 -7 C-2 -8 0 -6 0 -4 C0 -6 2 -8 5 -7 C10 -5 9 3 0 9 Z";

/** Chapitre 06 : un chemin qui monte, quatre étapes. */
export function BuildArt() {
  const { ref, on, tr, loop, reduce } = useArt();
  const road = "M50 240 C90 240 100 190 140 190 S200 140 240 140 S300 80 340 80";
  const stops: [number, number][] = [[50, 240], [140, 190], [240, 140], [340, 80]];
  return (
    <ArtFrame label="Un chemin sinueux jalonné de quatre étapes : se retrouver, agir avec le club, grandir, porter une image positive" viewBox="0 0 400 300" svgRef={ref}>
      <motion.path d={road} stroke="rgba(255,255,255,.18)" strokeWidth="14" strokeLinecap="round" fill="none" initial={{ pathLength: reduce ? 1 : 0 }} animate={on ? { pathLength: 1 } : {}} transition={tr(0, 1.8)} />
      <motion.path d={road} stroke={WHITE} strokeWidth="2" strokeDasharray="4 8" strokeLinecap="round" fill="none" initial={{ pathLength: reduce ? 1 : 0 }} animate={on ? { pathLength: 1 } : {}} transition={tr(0.2, 1.8)} />
      {stops.map(([x, y], i) => (
        <motion.g key={i} transform={`translate(${x} ${y})`} initial={{ opacity: 0 }} animate={on ? { opacity: 1 } : {}} transition={tr(0.4 + i * 0.45, 0.5)}>
          <motion.circle r="22" fill="none" stroke={i % 2 ? SKY : RED} strokeWidth="2" style={CENTER} animate={on ? { scale: [1, 1.35], opacity: [0.7, 0] } : {}} transition={loop(2.2, i * 0.5)} />
          <circle r="17" fill={ROYAL} stroke={i % 2 ? SKY : RED} strokeWidth="2.5" />
          {i === 0 && (
            <g fill={WHITE}>
              <circle cx="-5" cy="-3" r="3.4" />
              <circle cx="5" cy="-3" r="3.4" />
              <path d="M-10 8 Q-10 2 -5 2 Q0 2 0 8 Z M0 8 Q0 2 5 2 Q10 2 10 8 Z" />
            </g>
          )}
          {i === 1 && <path d="M-5 9 V-9 M-5 -9 H7 L4 -4 L7 1 H-5" stroke={WHITE} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />}
          {i === 2 && (
            <g stroke={WHITE} strokeWidth="1.8" fill="none">
              <circle r="9" />
              <ellipse rx="4" ry="9" />
              <path d="M-9 0 H9" />
            </g>
          )}
          {i === 3 && <path d={HEART} fill={RED} />}
        </motion.g>
      ))}
      <motion.circle r="5" fill={RED} initial={{ opacity: 0 }} animate={on ? { opacity: 1, offsetDistance: ["0%", "100%"] } : {}} transition={reduce ? { duration: 0 } : { duration: 5, delay: 2, repeat: Infinity, ease: "linear" }} style={{ offsetPath: `path("${road}")` }} />
    </ArtFrame>
  );
}

/** Chapitre 07 : des voix qui portent. */
export function VoicesArt() {
  const { ref, on, tr, loop, reduce } = useArt();
  const bubbles = [
    { x: 30, y: 40, w: 150, fill: WHITE, bars: RED },
    { x: 200, y: 96, w: 170, fill: RED, bars: WHITE },
    { x: 60, y: 168, w: 140, fill: BLUE, bars: WHITE },
  ];
  return (
    <ArtFrame label="Trois bulles de dialogue qui vibrent comme des voix" viewBox="0 0 400 280" svgRef={ref}>
      {[1, 2, 3].map((k) => (
        <motion.path key={k} d={`M${200 - k * 55} 268 Q200 ${268 - k * 60} ${200 + k * 55} 268`} stroke="rgba(255,255,255,.14)" strokeWidth="2" fill="none" initial={{ pathLength: reduce ? 1 : 0 }} animate={on ? { pathLength: 1 } : {}} transition={tr(k * 0.25, 1)} />
      ))}
      {bubbles.map((b, i) => (
        <motion.g key={i} initial={{ opacity: 0, y: 20 }} animate={on ? { opacity: 1, y: [0, -6, 0] } : {}} transition={{ opacity: tr(i * 0.35).duration === 0 ? { duration: 0 } : { duration: 0.6, delay: i * 0.35 }, y: loop(3.2 + i * 0.6, i * 0.35) }}>
          <rect x={b.x} y={b.y} width={b.w} height="64" rx="32" fill={b.fill} />
          <path d={`M${b.x + 30} ${b.y + 62} L${b.x + 20} ${b.y + 82} L${b.x + 52} ${b.y + 62} Z`} fill={b.fill} />
          {Array.from({ length: 9 }, (_, k) => (
            <motion.rect key={k} x={b.x + 24 + k * ((b.w - 60) / 8)} y={b.y + 22} width="6" height="20" rx="3" fill={b.bars} style={CENTER} animate={on ? { scaleY: [0.3, 1, 0.5, 0.9, 0.3] } : {}} transition={loop(1.1 + (k % 3) * 0.2, k * 0.08)} />
          ))}
        </motion.g>
      ))}
      <motion.path d={HEART} transform="translate(340 60) scale(1.6)" fill={SKY} style={CENTER} animate={on ? { scale: [1.6, 1.9, 1.6] } : {}} transition={loop(1.6)} />
    </ArtFrame>
  );
}

const TOWER = "M200 34 L207 95 L216 140 L228 190 L250 286 L226 286 L214 250 L200 236 L186 250 L174 286 L150 286 L172 190 L184 140 L193 95 Z";

/** Chapitre 08 : la Tour Eiffel s'illumine en rouge et bleu, la foule est là. */
export function TowerArt() {
  const { ref, on, tr, loop, reduce } = useArt();
  return (
    <ArtFrame label="La Tour Eiffel qui s’illumine en rouge et bleu au-dessus d’une foule de supportrices" viewBox="0 0 400 320" svgRef={ref}>
      <defs>
        <linearGradient id="tower-split" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0.5" stopColor={RED} />
          <stop offset="0.5" stopColor={BLUE} />
        </linearGradient>
        <filter id="tower-glow" x="-40%" y="-20%" width="180%" height="140%">
          <feGaussianBlur stdDeviation="7" />
        </filter>
      </defs>
      <motion.path d={TOWER} fill="url(#tower-split)" filter="url(#tower-glow)" initial={{ opacity: 0 }} animate={on ? { opacity: [0, 0.9, 0.55, 0.9] } : {}} transition={reduce ? { duration: 0 } : { duration: 3, delay: 2, repeat: Infinity, repeatType: "mirror" }} />
      <motion.path d={TOWER} fill="url(#tower-split)" initial={{ opacity: 0 }} animate={on ? { opacity: 1 } : {}} transition={tr(1.6, 1.2)} />
      <motion.path d={TOWER} stroke={WHITE} strokeWidth="2.5" strokeLinejoin="round" fill="none" initial={{ pathLength: reduce ? 1 : 0 }} animate={on ? { pathLength: 1 } : {}} transition={tr(0, 1.8)} />
      <path d="M200 34 V14" stroke={WHITE} strokeWidth="2.5" strokeLinecap="round" />
      {["M193 95 H207", "M184 140 H216", "M172 190 H228", "M186 250 Q200 224 214 250"].map((d) => (
        <motion.path key={d} d={d} stroke={WHITE} strokeWidth="2" fill="none" initial={{ pathLength: reduce ? 1 : 0 }} animate={on ? { pathLength: 1 } : {}} transition={tr(1.2, 0.8)} />
      ))}
      {[[110, 70], [300, 90], [80, 160], [330, 170], [250, 50]].map(([x, y], i) => (
        <motion.path key={i} d="M0 -7 L2 -2 L7 0 L2 2 L0 7 L-2 2 L-7 0 L-2 -2 Z" transform={`translate(${x} ${y})`} fill={i % 2 ? SKY : RED} style={CENTER} initial={{ opacity: 0 }} animate={on ? { opacity: [0.1, 1, 0.1], scale: [0.7, 1.2, 0.7] } : {}} transition={loop(2.4, 2 + i * 0.35)} />
      ))}
      <path d="M0 290 H400" stroke="rgba(255,255,255,.25)" />
      {Array.from({ length: 17 }, (_, i) => (
        <motion.g key={i} transform={`translate(${12 + i * 23} 300)`} initial={{ opacity: 0 }} animate={on ? { opacity: 1 } : {}} transition={tr(2.4 + i * 0.05, 0.4)}>
          <motion.g animate={on ? { y: [0, -5, 0] } : {}} transition={loop(1.2 + (i % 4) * 0.2, i * 0.1)}>
            <circle cy="-8" r="6" fill={i % 3 === 0 ? RED : i % 3 === 1 ? SKY : WHITE} />
            <path d="M-8 20 Q-8 0 0 0 Q8 0 8 20 Z" fill={i % 3 === 0 ? RED : i % 3 === 1 ? BLUE : ROYAL} />
          </motion.g>
        </motion.g>
      ))}
    </ArtFrame>
  );
}

const FRANCE = "M170 40 L232 56 L286 96 L282 150 L302 200 L252 250 L190 266 L140 250 L94 214 L84 150 L106 100 L140 56 Z";
const CITIES = [
  { n: "Normandie", x: 150, y: 88, a: "end", dx: -10 },
  { n: "Metz", x: 268, y: 104, a: "start", dx: 10 },
  { n: "Nantes", x: 112, y: 156, a: "end", dx: -10 },
  { n: "Bordeaux", x: 142, y: 212, a: "end", dx: -10 },
] as const;

/** Chapitre 10 : de toute la France, tout mène à Paris. */
export function FranceArt() {
  const { ref, on, tr, loop, reduce } = useArt();
  const paris = { x: 196, y: 112 };
  return (
    <ArtFrame label="Une carte de France stylisée : des supportrices de Normandie, Metz, Nantes et Bordeaux rejoignent Paris" viewBox="0 0 400 300" svgRef={ref}>
      <motion.path d={FRANCE} fill="rgba(27,63,143,.25)" stroke={WHITE} strokeWidth="2" strokeLinejoin="round" initial={{ pathLength: reduce ? 1 : 0 }} animate={on ? { pathLength: 1 } : {}} transition={tr(0, 1.6)} />
      {CITIES.map((c, i) => (
        <g key={c.n}>
          <motion.path d={`M${c.x} ${c.y} L${paris.x} ${paris.y}`} stroke={i % 2 ? SKY : RED} strokeWidth="2.5" strokeDasharray="5 7" fill="none" initial={{ opacity: 0 }} animate={on ? { opacity: 1, strokeDashoffset: [0, -24] } : {}} transition={{ opacity: { duration: reduce ? 0 : 0.5, delay: 1.2 + i * 0.3 }, strokeDashoffset: reduce ? { duration: 0 } : { duration: 1.2, repeat: Infinity, ease: "linear" } }} />
          <motion.g initial={{ opacity: 0 }} animate={on ? { opacity: 1 } : {}} transition={tr(1 + i * 0.3, 0.5)}>
            <circle cx={c.x} cy={c.y} r="6" fill={i % 2 ? SKY : RED} />
            <text x={c.x + c.dx} y={c.y + 4} textAnchor={c.a} fontSize="13" fontWeight="600" fill={WHITE}>{c.n}</text>
          </motion.g>
        </g>
      ))}
      <motion.g transform={`translate(${paris.x} ${paris.y})`} initial={{ opacity: 0 }} animate={on ? { opacity: 1 } : {}} transition={tr(0.8, 0.5)}>
        <motion.circle r="16" fill="none" stroke={RED} strokeWidth="2" style={CENTER} animate={on ? { scale: [1, 1.8], opacity: [0.8, 0] } : {}} transition={loop(1.8)} />
        <path d="M0 -14 L7 12 H3 L0 4 L-3 12 H-7 Z" fill={RED} stroke={WHITE} strokeWidth="1.2" strokeLinejoin="round" />
        <text x="14" y="-12" fontSize="14" fontWeight="700" fill={WHITE}>Paris</text>
      </motion.g>
    </ArtFrame>
  );
}

/** Conclusion : deux cœurs, rouge et bleu, qui n'en font qu'un. */
export function HeartsArt() {
  const { ref, on, tr, loop, reduce } = useArt();
  const big = "M200 250 C90 180 80 100 140 80 C175 68 195 90 200 105 C205 90 225 68 260 80 C320 100 310 180 200 250 Z";
  return (
    <ArtFrame label="Un grand cœur mi-rouge mi-bleu, entouré de petits cœurs qui s’envolent" viewBox="0 0 400 300" svgRef={ref}>
      <defs>
        <clipPath id="heart-l"><rect x="0" y="0" width="200" height="300" /></clipPath>
        <clipPath id="heart-r"><rect x="200" y="0" width="200" height="300" /></clipPath>
      </defs>
      <motion.g style={CENTER} animate={on ? { scale: [1, 1.04, 1] } : {}} transition={loop(1.8, 2)}>
        <motion.path d={big} fill={RED} clipPath="url(#heart-l)" initial={{ opacity: 0 }} animate={on ? { opacity: 1 } : {}} transition={tr(1, 1)} />
        <motion.path d={big} fill={BLUE} clipPath="url(#heart-r)" initial={{ opacity: 0 }} animate={on ? { opacity: 1 } : {}} transition={tr(1, 1)} />
        <motion.path d={big} stroke={WHITE} strokeWidth="3" strokeLinejoin="round" fill="none" initial={{ pathLength: reduce ? 1 : 0 }} animate={on ? { pathLength: 1 } : {}} transition={tr(0, 1.6)} />
      </motion.g>
      {Array.from({ length: 8 }, (_, i) => (
        <motion.path
          key={i}
          d="M0 9 C-9 3 -10 -5 -5 -7 C-2 -8 0 -6 0 -4 C0 -6 2 -8 5 -7 C10 -5 9 3 0 9 Z"
          transform={`translate(${60 + i * 42} 270)`}
          fill={i % 2 ? SKY : RED}
          initial={{ opacity: 0, y: 0 }}
          animate={on ? { opacity: [0, 1, 0], y: [0, -150 - (i % 3) * 30] } : {}}
          transition={reduce ? { duration: 0 } : { duration: 3.4 + (i % 3) * 0.6, delay: 2 + i * 0.4, repeat: Infinity, ease: "easeOut" }}
        />
      ))}
    </ArtFrame>
  );
}

/** Adhésion : une communauté ouverte, et un cercle de membres au centre. */
export function CircleArt() {
  const { ref, on, tr, reduce } = useArt();
  const dots = Array.from({ length: 14 }, (_, i) => {
    const a = (i / 14) * Math.PI * 2;
    return { x: 120 * Math.cos(a), y: 120 * Math.sin(a) };
  });
  return (
    <ArtFrame label="Un large cercle pointillé, la communauté ouverte, autour d’un cercle plus proche : les membres adhérentes" viewBox="0 0 400 300" svgRef={ref}>
      <g transform="translate(200 150)">
        <motion.g animate={on ? { rotate: 360 } : {}} transition={reduce ? { duration: 0 } : { duration: 60, repeat: Infinity, ease: "linear" }}>
          <circle r="120" fill="none" stroke="rgba(255,255,255,.35)" strokeWidth="2" strokeDasharray="3 9" />
          {dots.map((d, i) => (
            <motion.circle key={i} cx={d.x} cy={d.y} r="6" fill={i % 3 === 0 ? RED : i % 3 === 1 ? SKY : WHITE} style={CENTER} initial={{ scale: reduce ? 1 : 0 }} animate={on ? { scale: 1 } : {}} transition={tr(0.3 + i * 0.08, 0.5)} />
          ))}
        </motion.g>
        <motion.circle r="68" fill="rgba(240,22,52,.12)" stroke={RED} strokeWidth="3" style={CENTER} initial={{ scale: reduce ? 1 : 0.4, opacity: reduce ? 1 : 0 }} animate={on ? { scale: 1, opacity: 1 } : {}} transition={tr(0.4, 1)} />
        <motion.g initial={{ opacity: 0 }} animate={on ? { opacity: 1 } : {}} transition={tr(1.2, 0.6)}>
          <rect x="-34" y="-22" width="68" height="44" rx="6" fill={ROYAL} stroke={WHITE} strokeWidth="2" />
          <rect x="-34" y="-10" width="68" height="8" fill={RED} />
          <rect x="-26" y="8" width="20" height="5" rx="2" fill={WHITE} />
          <rect x="-26" y="-18" width="8" height="6" rx="1.5" fill={SKY} />
        </motion.g>
      </g>
    </ArtFrame>
  );
}
