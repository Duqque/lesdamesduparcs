import { easeInOut, MotionValue, useTransform } from "framer-motion";

/** Points de passage de la chorégraphie (progression du scroll 0 → 1). */
export const STOPS = [0, 0.07, 0.2, 0.28, 0.33, 0.41, 0.46, 0.57, 0.61, 0.69, 0.74, 0.8, 0.85, 0.89, 0.93, 0.965, 1];

export const POSE = {
  //         intro  ·  story ·  nom   ·  flip  ·  orbite  · agenda ·  news  · virtuelle · foule · final
  ry: [-18, -10, 12, 0, 0, 180, 360, 352, 372, 372, 540, 540, 720, 720, 720, 730, 726],
  rx: [12, 8, 5, 0, 0, 2, 6, 6, 4, 4, 0, 0, 0, 0, 4, 6, 6],
  rz: [-4, -2, 1, 0, 0, 0, -2, -2, 0, 0, 0, 0, 0, 0, -2, -2, -2],
  z: [-260, 0, 120, 40, 40, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  scaleD: [0.62, 0.8, 0.95, 1.15, 1.12, 1.05, 0.7, 0.72, 0.8, 0.8, 1, 1.05, 1.3, 1.3, 0.5, 0.72, 0.78],
  scaleM: [0.7, 0.85, 1, 1.2, 1.15, 1, 0.72, 0.75, 0.72, 0.72, 0.95, 1, 1.1, 1.1, 0.55, 0.72, 0.78],
  xD: [0, 0, 0, 0, 0, 0, 0, 0, -21, -21, 0, 0, 0, 0, 0, 0, 0],
  yD: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, -4, -4, 0, -6, -7],
  yM: [0, 0, 0, 0, 0, 0, 0, 0, -16, -16, 0, 0, -8, -8, 0, -8, -9],
} as const;

export function useTrack(p: MotionValue<number>, values: readonly number[]) {
  return useTransform(p, STOPS, values as number[], { ease: easeInOut });
}

/** Fenêtre 0 → 1 → 1 → 0 entre quatre valeurs de progression. */
export function useWindow(p: MotionValue<number>, a: number, b: number, c: number, d: number) {
  return useTransform(p, [a, b, c, d], [0, 1, 1, 0]);
}

/** Mélange une valeur bureau / mobile selon le flag `desk` (1 = bureau). */
export function useMix(desk: MotionValue<number>, onDesktop: MotionValue<number>, onMobile: MotionValue<number>) {
  return useTransform([onDesktop, onMobile, desk], ([a, b, k]) => (a as number) * (k as number) + (b as number) * (1 - (k as number)));
}
