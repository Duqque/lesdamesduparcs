import { Reveal } from "@/components/ui/Reveal";

interface Item {
  readonly title?: string;
  readonly text: string;
}

/**
 * Frise horizontale d'étapes numérotées, reliées par un trait : réservée à `lg` et plus, assez de largeur pour des colonnes
 * lisibles. En dessous, on retombe sur la présentation verticale classique (voir `Timeline`), plus confortable à lire sur un écran
 * étroit. Le trait est calé mathématiquement sur le centre de la première et de la dernière puce (colonnes de largeur égale).
 */
export function HorizontalSteps({ items, label }: { items: readonly Item[]; label: string }) {
  const inset = 50 / items.length;
  return (
    <div className="hidden lg:block">
      <ol aria-label={label} className="relative flex items-start">
        <span aria-hidden className="absolute top-6 h-px bg-white/15" style={{ left: `${inset}%`, right: `${inset}%` }} />
        {items.map((it, i) => (
          <li key={it.text} className="relative flex min-w-0 flex-1 flex-col items-center gap-4 text-center">
            <Reveal delay={i * 0.08} className="flex min-w-0 flex-col items-center gap-4">
              <span className="relative z-10 grid size-12 shrink-0 place-items-center rounded-full border border-psg-red-bright/60 bg-night-900 font-display text-[18px] font-semibold tabular-nums text-white">
                {i + 1}
              </span>
              <span className="min-w-0 max-w-[22ch]">
                {it.title && <span className="block break-words font-body text-[17px] font-semibold text-white">{it.title}</span>}
                <span className="mt-1.5 block break-words text-mist t-small">{it.text}</span>
              </span>
            </Reveal>
          </li>
        ))}
      </ol>
    </div>
  );
}
