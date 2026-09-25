"use client";

import { motion } from "framer-motion";
import { ArtFrame, CENTER, RED, ROYAL, SKY, WHITE, useArt } from "./ArtFrame";

/** Chapitre 09 : le parcours d'une journée au Parc, du tunnel à la pelouse. */
export function RouteArt() {
  const { ref, on, tr, loop, reduce } = useArt();
  const route = "M24 150 C80 70 150 230 200 150 S320 80 376 150";
  return (
    <ArtFrame label="Un terrain vu du dessus, avec un parcours en pointillés qui le traverse du tunnel jusqu’à la sortie" viewBox="0 0 400 300" svgRef={ref}>
      <motion.g initial={{ opacity: 0 }} animate={on ? { opacity: 1 } : {}} transition={tr(0, 0.6)}>
        <rect x="24" y="50" width="352" height="200" rx="8" fill="rgba(27,63,143,.22)" stroke={WHITE} strokeWidth="2" />
        <path d="M200 50 V250" stroke="rgba(255,255,255,.5)" strokeWidth="2" />
        <circle cx="200" cy="150" r="30" fill="none" stroke="rgba(255,255,255,.5)" strokeWidth="2" />
        <rect x="24" y="100" width="48" height="100" fill="none" stroke="rgba(255,255,255,.5)" strokeWidth="2" />
        <rect x="328" y="100" width="48" height="100" fill="none" stroke="rgba(255,255,255,.5)" strokeWidth="2" />
      </motion.g>
      <motion.path d={route} stroke={RED} strokeWidth="4" strokeDasharray="2 10" strokeLinecap="round" fill="none" initial={{ pathLength: reduce ? 1 : 0 }} animate={on ? { pathLength: 1 } : {}} transition={tr(0.5, 2)} />
      {[[24, 150], [200, 150], [376, 150]].map(([x, y], i) => (
        <motion.circle key={i} cx={x} cy={y} r="8" fill={i === 1 ? SKY : RED} stroke={ROYAL} strokeWidth="3" style={CENTER} initial={{ scale: reduce ? 1 : 0 }} animate={on ? { scale: 1 } : {}} transition={tr(0.8 + i * 0.7, 0.5)} />
      ))}
      <motion.circle r="7" fill={WHITE} stroke={RED} strokeWidth="2" initial={{ opacity: 0 }} animate={on ? { opacity: 1, offsetDistance: ["0%", "100%"] } : {}} transition={reduce ? { duration: 0 } : { duration: 6, delay: 2.4, repeat: Infinity, ease: "linear" }} style={{ offsetPath: `path("${route}")` }} />
      <motion.path d="M200 26 L206 40 L221 42 L210 52 L213 67 L200 60 L187 67 L190 52 L179 42 L194 40 Z" fill={RED} transform="translate(0 -6) scale(.9)" style={CENTER} animate={on ? { rotate: [0, 8, -8, 0] } : {}} transition={loop(3)} />
    </ArtFrame>
  );
}
