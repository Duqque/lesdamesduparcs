import { easeInOut, MotionValue, useTransform } from "framer-motion";

/** Points de passage de la chorégraphie (progression du scroll 0 → 1). */
export const STOPS = [0, 0.07, 0.2, 0.28, 0.33, 0.41, 0.46, 0.57, 0.61, 0.69, 0.74, 0.8, 0.85, 0.89, 0.93, 0.965, 1];

/** La carte ne se déplace jamais : seules ses rotations évoluent. */
export const POSE = {
  ry: [-18, -10, 12, 0, 0, 180, 360, 352, 372, 372, 540, 540, 720, 720, 720, 730, 726],
  rx: [12, 8, 5, 0, 0, 2, 6, 6, 4, 4, 0, 0, 0, 0, 4, 6, 6],
  rz: [-4, -2, 1, 0, 0, 0, -2, -2, 0, 0, 0, 0, 0, 0, -2, -2, -2],
} as const;

export function useTrack(p: MotionValue<number>, values: readonly number[]) {
  return useTransform(p, STOPS, values as number[], { ease: easeInOut });
}

/** Fenêtre 0 → 1 → 1 → 0 entre quatre valeurs de progression. */
export function useWindow(p: MotionValue<number>, a: number, b: number, c: number, d: number) {
  return useTransform(p, [a, b, c, d], [0, 1, 1, 0]);
}
