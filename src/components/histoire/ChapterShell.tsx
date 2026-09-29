import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { ChapterIcon } from "./ChapterIcon";
import { Reveal } from "@/components/ui/Reveal";
import { chapters, type Chapter } from "@/data/chapters";
import { cn } from "@/lib/cn";
import { wrap } from "./styles";

interface Props {
  chapter: Chapter;
  art: ReactNode;
  children: ReactNode;
  /** Page hors de la rubrique « Le groupe » (ex. adhésion) : pas de chapitres ni de navigation précédent/suivant. */
  standalone?: { parentHref: string; parentLabel: string; eyebrow: string };
}

/** Cadre commun des sous-pages du groupe : fil d'ariane, titre, illustration, navigation entre chapitres. */
export function ChapterShell({ chapter, art, children, standalone }: Props) {
  const i = chapters.findIndex((c) => c.slug === chapter.slug);
  const prev = chapters[i - 1];
  const next = chapters[i + 1];
  return (
    <main className="overflow-x-clip">
      <section aria-labelledby="chapitre-titre" className="relative isolate overflow-hidden pb-16 pt-[150px] md:pb-24 md:pt-[210px]">
        <div aria-hidden className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_60%_60%_at_78%_40%,rgba(26,52,112,0.5),transparent_70%)]" />
        <div className={wrap}>
          <nav aria-label="Fil d’Ariane" className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 font-body text-[13px] text-white/60">
            <Link href={standalone?.parentHref ?? "/qui-sommes-nous"} className="inline-flex min-h-11 items-center gap-2 transition-colors hover:text-white">
              <ArrowLeft aria-hidden className="size-4" />
              {standalone?.parentLabel ?? "Le groupe"}
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
                {standalone ? standalone.eyebrow : chapter.number ? `Chapitre ${chapter.number}` : "Pour finir"}
              </p>
              <h1 id="chapitre-titre" className="mt-5 break-words text-balance font-display text-[clamp(32px,6vw,84px)] font-semibold uppercase leading-[1.02] tracking-[0.04em] text-white">
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

      {!standalone && (
      <nav aria-label="Chapitres du groupe" className={cn(wrap, "pb-12 md:pb-16")}>
        <ol className="flex snap-x gap-2 overflow-x-auto pb-3 [scrollbar-width:thin]">
          {chapters.map((c) => (
            <li key={c.slug} className="shrink-0 snap-start">
              <Link
                href={`/groupe/${c.slug}`}
                aria-current={c.slug === chapter.slug ? "page" : undefined}
                className={cn(
                  "flex min-h-11 items-center gap-2.5 whitespace-nowrap rounded-[10px] border px-4 font-body text-[13px] font-medium transition-colors duration-300",
                  c.slug === chapter.slug ? "border-psg-red-bright/60 bg-night-800 text-white" : "border-line bg-night-900/85 text-white/65 hover:border-white/30 hover:text-white",
                )}
              >
                <span className="tabular-nums text-psg-red-bright">{c.number ?? "·"}</span>
                {c.title}
              </Link>
            </li>
          ))}
        </ol>
      </nav>
      )}

      <div className="pb-24 md:pb-32">{children}</div>

      {!standalone && (
      <nav aria-label="Chapitre précédent et suivant" className={cn(wrap, "pb-24 md:pb-32")}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {prev ? (
            <Link href={`/groupe/${prev.slug}`} className="group min-w-0 overflow-hidden rounded-[10px] border border-line bg-night-900/85 p-6 transition-colors hover:border-white/30 md:p-8">
              <p className="flex items-center gap-2 t-caption text-mist">
                <ArrowLeft aria-hidden className="size-4 transition-transform duration-300 group-hover:-translate-x-1" />
                Chapitre précédent
              </p>
              <p className="mt-3 break-words font-display text-[clamp(20px,2.2vw,28px)] font-semibold uppercase leading-[1.1] tracking-[0.04em] text-white">{prev.title}</p>
            </Link>
          ) : (
            <span aria-hidden className="hidden sm:block" />
          )}
          {next && (
            <Link href={`/groupe/${next.slug}`} className="group min-w-0 overflow-hidden rounded-[10px] border border-line bg-night-900/85 p-6 transition-colors hover:border-white/30 sm:text-right md:p-8">
              <p className="flex items-center gap-2 t-caption text-mist sm:justify-end">
                Chapitre suivant
                <ArrowRight aria-hidden className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
              </p>
              <p className="mt-3 break-words font-display text-[clamp(20px,2.2vw,28px)] font-semibold uppercase leading-[1.1] tracking-[0.04em] text-white">{next.title}</p>
            </Link>
          )}
        </div>
      </nav>
      )}
    </main>
  );
}
