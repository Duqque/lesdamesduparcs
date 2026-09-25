"use client";

import { motion } from "framer-motion";
import { ArtFrame, BLUE, CENTER, INK, RED, ROYAL, SKY, WHITE, useArt } from "./ArtFrame";

const HEART = "M0 9 C-9 3 -10 -5 -5 -7 C-2 -8 0 -6 0 -4 C0 -6 2 -8 5 -7 C10 -5 9 3 0 9 Z";

/** Chapitre 01 : une lettre sort de son enveloppe et s'écrit. */
export function LetterArt() {
  const { ref, on, tr, loop, reduce } = useArt();
  const lines = ["M152 172 H248", "M152 190 H236", "M152 208 H244", "M152 226 H214"];
  return (
    <ArtFrame label="Une lettre qui sort de son enveloppe, marquée d’un cœur" viewBox="0 0 400 300" svgRef={ref}>
      {[[60, 60], [340, 80], [90, 240], [330, 230], [200, 28]].map(([x, y], i) => (
        <motion.path
          key={i}
          d="M0 -8 L2 -2 L8 0 L2 2 L0 8 L-2 2 L-8 0 L-2 -2 Z"
          transform={`translate(${x} ${y})`}
          fill={i % 2 ? SKY : RED}
          style={CENTER}
          initial={{ opacity: 0 }}
          animate={on ? { opacity: [0.2, 1, 0.2], scale: [0.8, 1.1, 0.8] } : {}}
          transition={loop(2.6, i * 0.4)}
        />
      ))}
      <rect x="110" y="150" width="180" height="110" rx="8" fill={ROYAL} stroke="rgba(255,255,255,.35)" />
      <motion.path d="M110 150 L200 90 L290 150 Z" fill="#1b3f8f" stroke="rgba(255,255,255,.35)" initial={{ opacity: 0 }} animate={on ? { opacity: 1 } : {}} transition={tr(0.4, 0.3)} />
      <motion.g initial={{ y: 0 }} animate={on ? { y: -78 } : {}} transition={tr(0.9, 1.1)}>
        <rect x="132" y="158" width="136" height="100" rx="4" fill={WHITE} />
        {lines.map((d, i) => (
          <motion.path key={d} d={d} stroke={INK} strokeWidth="4" strokeLinecap="round" fill="none" initial={{ pathLength: reduce ? 1 : 0 }} animate={on ? { pathLength: 1 } : {}} transition={tr(2 + i * 0.35, 0.6)} />
        ))}
        <motion.path d={HEART} transform="translate(200 240)" fill={RED} style={CENTER} initial={{ scale: reduce ? 1 : 0 }} animate={on ? { scale: [0, 1.25, 1] } : {}} transition={tr(3.5, 0.6)} />
      </motion.g>
      <path d="M110 260 L110 152 L200 212 L290 152 L290 260 Z" fill="#0f2652" stroke="rgba(255,255,255,.4)" strokeLinejoin="round" />
      <motion.path d="M110 150 L200 210 L290 150 Z" fill="#1b3f8f" stroke="rgba(255,255,255,.4)" strokeLinejoin="round" initial={{ opacity: 1 }} animate={on ? { opacity: 0 } : {}} transition={tr(0.4, 0.2)} />
    </ArtFrame>
  );
}

/** Chapitre 02 : un message, puis vingt-deux femmes qui se relient. */
export function StoryArt() {
  const { ref, on, tr, loop, reduce } = useArt();
  const N = 22;
  const pts = Array.from({ length: N }, (_, i) => {
    const a = (i / N) * Math.PI * 2 - Math.PI / 2;
    return { x: 200 + 128 * Math.cos(a), y: 192 + 88 * Math.sin(a) };
  });
  const col = [RED, SKY, WHITE];
  return (
    <ArtFrame label="Un message de discussion, puis vingt-deux femmes reliées entre elles autour d’un cœur" viewBox="0 0 400 320" svgRef={ref}>
      <rect x="120" y="14" width="160" height="50" rx="25" fill={WHITE} />
      <path d="M170 62 L162 78 L188 62 Z" fill={WHITE} />
      {[0, 1, 2].map((i) => (
        <motion.circle key={i} cx={172 + i * 28} cy="39" r="6" fill={INK} animate={on ? { y: [0, -6, 0] } : {}} transition={loop(0.9, i * 0.15)} />
      ))}
      {pts.map((p, i) => {
        const q = pts[(i + 1) % N];
        return (
          <motion.line key={`l${i}`} x1={p.x} y1={p.y} x2={q.x} y2={q.y} stroke="rgba(255,255,255,.35)" strokeWidth="1.5" initial={{ pathLength: reduce ? 1 : 0 }} animate={on ? { pathLength: 1 } : {}} transition={tr(1 + i * 0.07, 0.5)} />
        );
      })}
      {pts.map((p, i) => (
        <motion.circle key={`n${i}`} cx={p.x} cy={p.y} r="7.5" fill={col[i % 3]} style={CENTER} initial={{ scale: reduce ? 1 : 0 }} animate={on ? { scale: 1 } : {}} transition={tr(0.8 + i * 0.07, 0.5)} />
      ))}
      <motion.g transform="translate(200 192) scale(2.6)" initial={{ opacity: 0 }} animate={on ? { opacity: 1 } : {}} transition={tr(2.6, 0.6)}>
        <motion.path d={HEART} fill={RED} style={CENTER} animate={on ? { scale: [1, 1.15, 1] } : {}} transition={loop(1.4, 3)} />
      </motion.g>
    </ArtFrame>
  );
}

const HAIR = [
  (c: string) => <circle cx="31" cy="9" r="5.5" fill={c} />,
  (c: string) => <path d="M20 22 Q17 46 25 52 M42 22 Q45 46 37 52" stroke={c} strokeWidth="4" strokeLinecap="round" fill="none" />,
  (c: string) => <circle cx="31" cy="20" r="16" fill={c} opacity=".55" />,
  (c: string) => <path d="M20 21 Q31 4 42 21" stroke={c} strokeWidth="5" strokeLinecap="round" fill="none" />,
];

/** Chapitre 03 : vingt-deux profils, tous différents. */
export function WhoArt() {
  const { ref, on, tr, loop, reduce } = useArt();
  const col = [RED, SKY, WHITE, BLUE];
  return (
    <ArtFrame label="Vingt-deux silhouettes de supportrices, aux coiffures et aux couleurs variées" viewBox="0 0 400 300" svgRef={ref}>
      {Array.from({ length: 22 }, (_, i) => {
        const x = 14 + (i % 6) * 62, y = 20 + Math.floor(i / 6) * 66, c = col[(i * 3 + Math.floor(i / 6)) % 4];
        return (
          <g key={i} transform={`translate(${x} ${y})`}>
            <motion.g style={CENTER} initial={{ scale: reduce ? 1 : 0, opacity: reduce ? 1 : 0 }} animate={on ? { scale: 1, opacity: 1 } : {}} transition={tr(i * 0.07, 0.6)}>
              <motion.g animate={on ? { y: [0, -3, 0] } : {}} transition={loop(3 + (i % 3) * 0.5, i * 0.1)}>
                {HAIR[i % 4](c)}
                <circle cx="31" cy="24" r="10" fill={WHITE} />
                <path d="M12 60 Q12 38 31 38 Q50 38 50 60 Z" fill={c} />
              </motion.g>
            </motion.g>
          </g>
        );
      })}
    </ArtFrame>
  );
}

/** Chapitre 05 : les gradins se remplissent, personne ne reste seule. */
export function StandsArt() {
  const { ref, on, tr, loop, reduce } = useArt();
  const col = [RED, SKY, WHITE, BLUE];
  const rows = 4, cols = 13;
  return (
    <ArtFrame label="Des gradins où une supportrice seule est peu à peu rejointe par toutes les autres" viewBox="0 0 400 300" svgRef={ref}>
      <motion.path d="M20 62 Q200 20 380 62" stroke="rgba(255,255,255,.4)" strokeWidth="3" fill="none" strokeLinecap="round" initial={{ pathLength: reduce ? 1 : 0 }} animate={on ? { pathLength: 1 } : {}} transition={tr(0, 1.2)} />
      {Array.from({ length: rows * cols }, (_, k) => {
        const r = Math.floor(k / cols), c = k % cols, x = 24 + c * 28, y = 92 + r * 46;
        const lone = r === 2 && c === 1;
        const occupied = lone || (k * 7 + r * 3) % 10 < 8;
        const delay = lone ? 0.5 : 1.8 + (c + r) * 0.09;
        const f = col[(k + r) % 4];
        return (
          <g key={k} transform={`translate(${x} ${y})`}>
            <rect width="20" height="14" rx="3" fill={ROYAL} stroke="rgba(255,255,255,.18)" />
            {occupied && (
              <motion.g style={CENTER} initial={{ scale: reduce ? 1 : 0, opacity: reduce ? 1 : 0 }} animate={on ? { scale: 1, opacity: 1 } : {}} transition={tr(delay, 0.5)}>
                <motion.g animate={on && !lone ? { y: [0, -2, 0] } : {}} transition={loop(2.4 + (c % 3) * 0.4, delay)}>
                  <circle cx="10" cy="-9" r="5.5" fill={lone ? RED : WHITE} />
                  <path d="M2 10 Q2 -3 10 -3 Q18 -3 18 10 Z" fill={lone ? RED : f} />
                </motion.g>
              </motion.g>
            )}
          </g>
        );
      })}
    </ArtFrame>
  );
}
