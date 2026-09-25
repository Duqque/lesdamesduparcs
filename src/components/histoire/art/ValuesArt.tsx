"use client";

import { motion } from "framer-motion";
import { ArtFrame, BLUE, CENTER, RED, ROYAL, SKY, WHITE, useArt } from "./ArtFrame";

/** Chapitre 04 : six piliers qui se dressent. */
export function ValuesArt() {
  const { ref, on, tr, loop, reduce } = useArt();
  const cols = [RED, SKY, WHITE, BLUE, RED, SKY];
  const heights = [120, 165, 140, 185, 150, 125];
  return (
    <ArtFrame label="Six piliers de hauteurs différentes, chacun surmonté d’une flamme de couleur : les six valeurs du groupe" viewBox="0 0 400 300" svgRef={ref}>
      <path d="M20 262 H380" stroke="rgba(255,255,255,.3)" strokeWidth="2" />
      {heights.map((hh, i) => {
        const x = 30 + i * 58;
        return (
          <g key={i}>
            <motion.rect x={x} y={262 - hh} width="42" height={hh} rx="6" fill={ROYAL} stroke={cols[i]} strokeWidth="2" style={{ transformOrigin: `${x + 21}px 262px` }} initial={{ scaleY: reduce ? 1 : 0 }} animate={on ? { scaleY: 1 } : {}} transition={tr(i * 0.15, 0.9)} />
            {[0.3, 0.55, 0.8].map((k) => (
              <path key={k} d={`M${x + 8} ${262 - hh * k} H${x + 34}`} stroke="rgba(255,255,255,.18)" strokeWidth="2" strokeLinecap="round" />
            ))}
            <motion.g initial={{ opacity: 0 }} animate={on ? { opacity: 1 } : {}} transition={tr(0.9 + i * 0.15, 0.4)}>
              <motion.circle cx={x + 21} cy={262 - hh - 16} r="9" fill={cols[i]} style={CENTER} animate={on ? { scale: [1, 1.25, 1] } : {}} transition={loop(1.8, i * 0.25)} />
              <motion.circle cx={x + 21} cy={262 - hh - 16} r="15" fill="none" stroke={cols[i]} strokeWidth="1.5" style={CENTER} animate={on ? { scale: [1, 1.5], opacity: [0.7, 0] } : {}} transition={loop(1.8, i * 0.25)} />
            </motion.g>
          </g>
        );
      })}
    </ArtFrame>
  );
}
