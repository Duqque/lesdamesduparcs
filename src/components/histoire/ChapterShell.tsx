import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { ChapterIcon } from "./ChapterIcon";
import { Reveal } from "@/components/ui/Reveal";
import type { Chapter } from "@/data/chapters";
import { wrap } from "./styles";

interface Props {
  chapter: Chapter;
  art: ReactNode;
  children: ReactNode;
  /** Page parente (fil d'Ariane) et étiquette au-dessus du titre. */
  standalone: { parentHref: string; parentLabel: string; eyebrow: string };
}

/** Cadre de page éditoriale : fil d'Ariane, titre, illustration, puis le contenu. */
export function ChapterShell({ chapter, art, children, standalone }: Props) {
  return (
    <main className="overflow-x-clip">
      <section aria-labelledby="chapitre-titre" className="relative isolate overflow-hidden pb-16 pt-[150px] md:pb-24 md:pt-[210px]">
        <div aria-hidden className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_60%_60%_at_78%_40%,rgba(26,52,112,0.5),transparent_70%)]" />
        <div className={wrap}>
          <nav aria-label="Fil d’Ariane" className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 font-body text-[13px] text-white/60">
            <Link href={standalone.parentHref} className="inline-flex min-h-11 items-center gap-2 transition-colors hover:text-white">
              <ArrowLeft aria-hidden className="size-4" />
              {standalone.parentLabel}
            </Link>
            <span aria-hidden>/</span>
            <span aria-current="page" className="min-w-0 break-words text-white">{chapter.title}</span>
          </nav>
          <div className="mt-8 grid items-center gap-12 md:grid-cols-[1.05fr_0.95fr] md:gap-16">
            <Reveal className="min-w-0">
              <p className="flex items-center gap-3 t-eyebrow">
                <span aria-hidden className="grid size-9 place-items-center overflow-hidden rounded-full border border-psg-red-bright/50">
                  <ChapterIcon name={chapter.icon} className="size-4 text-white" />
                </span>
                {standalone.eyebrow}
              </p>
              <h1 id="chapitre-titre" className="mt-5 break-words text-balance font-display text-[clamp(32px,6vw,64px)] font-semibold uppercase leading-[1.02] tracking-[0.04em] text-white">
                {chapter.title}
              </h1>
              <p className="mt-6 max-w-[46ch] break-words text-white/80 t-lead">{chapter.sub}</p>
            </Reveal>
            <Reveal delay={0.1} className="min-w-0">
              {art}
            </Reveal>
          </div>
        </div>
      </section>

      <div className="pb-24 md:pb-32">{children}</div>

    </main>
  );
}
