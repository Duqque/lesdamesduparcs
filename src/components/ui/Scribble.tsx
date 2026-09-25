import { cn } from "@/lib/cn";

/** Trait rouge manuscrit, dessiné à l'apparition. */
export function Scribble({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 320 22"
      preserveAspectRatio="none"
      className={cn("scribble text-psg-red", className)}
      fill="none"
    >
      <path
        pathLength={1}
        d="M4 15.5C48 8 96 5.5 150 7.5c50 2 104-.5 166-5.2-46 4-90 7.6-138 9.4-40 1.5-88 3-130 6.6"
        stroke="currentColor"
        strokeWidth="4.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
