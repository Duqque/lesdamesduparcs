import type { Metadata } from "next";
import { seoFor } from "@/lib/server/site";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { GroupHero } from "@/components/group/GroupHero";
import { ChapterIcon } from "@/components/histoire/ChapterIcon";
import { wrap } from "@/components/histoire/styles";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { chapters } from "@/data/chapters";

export async function generateMetadata(): Promise<Metadata> {
  return seoFor("/groupe", { title: "Le groupe", description: "Les Dames du Parc : 22 supportrices réunies par la même passion, le Paris Saint-Germain. Notre histoire, nos valeurs, pourquoi un fan club 100 % féminin, ce que nous voulons construire." });
}

export default function GroupPage() {
  return (
    <main className="overflow-x-clip">
      <GroupHero />

      <section aria-labelledby="chapitres" className={`${wrap} py-24 md:py-32`}>
        <Reveal className="mb-14 max-w-2xl">
          <p className="t-eyebrow">Le groupe</p>
          <h2 id="chapitres" className="mt-4 break-words text-balance font-display text-[clamp(30px,4.4vw,56px)] font-semibold uppercase leading-[1.04] tracking-[0.04em] text-white">
            Six parties
          </h2>
          <p className="mt-5 break-words text-white/80 t-lead">
            Qui nous sommes, en six pages courtes.
          </p>
        </Reveal>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {chapters.map((c, i) => (
            <li key={c.slug} className="min-w-0">
              <Reveal delay={(i % 3) * 0.06} className="h-full">
                <Link
                  href={`/groupe/${c.slug}`}
                  className="group relative flex h-full min-h-[230px] min-w-0 flex-col justify-between gap-8 overflow-hidden rounded-[10px] border border-line bg-night-900/85 p-7 transition-[border-color,background-color,transform] duration-500 hover:-translate-y-1 hover:border-psg-red-bright/50 hover:bg-night-800"
                >
                  <div aria-hidden className="pointer-events-none absolute -right-10 -top-10 size-32 rounded-full bg-psg-red/0 blur-2xl transition-colors duration-500 group-hover:bg-psg-red/25" />
                  <div className="relative flex items-start justify-between gap-4">
                    <span aria-hidden className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-full border border-psg-red-bright/50 bg-night-800 transition-transform duration-500 group-hover:-rotate-6 group-hover:scale-105">
                      <ChapterIcon name={c.icon} className="size-6 text-white" />
                    </span>
                    <span className="font-display text-[38px] font-semibold leading-none tabular-nums text-white/25 transition-colors duration-500 group-hover:text-psg-red-bright">{c.number ?? "·"}</span>
                  </div>
                  <div className="relative min-w-0">
                    <h3 className="break-words font-display text-[clamp(22px,2vw,28px)] font-semibold uppercase leading-[1.1] tracking-[0.04em] text-white">{c.title}</h3>
                    <p className="mt-3 line-clamp-3 break-words text-mist t-small">{c.sub}</p>
                  </div>
                  <span aria-hidden className="absolute bottom-6 right-6 grid size-9 place-items-center rounded-full border border-white/15 text-white/60 transition-[transform,color,border-color] duration-300 group-hover:translate-x-1 group-hover:border-psg-red-bright group-hover:text-white">
                    <ArrowRight className="size-4" />
                  </span>
                </Link>
              </Reveal>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="rejoindre" className="relative isolate overflow-hidden px-[var(--gutter)] py-28 text-center md:py-40">
        <div aria-hidden className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_60%_80%_at_50%_100%,rgba(217,15,44,0.18),transparent_70%)]" />
        <Reveal className="mx-auto max-w-2xl">
          <h2 id="rejoindre" className="break-words text-balance font-display text-[clamp(30px,4.4vw,56px)] font-semibold uppercase leading-[1.04] tracking-[0.04em] text-white">Rejoindre les Dames du Parc</h2>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button size="lg" href="/rejoindre-le-groupe">Devenir membre</Button>
            <Button size="lg" variant="outline" href="/rejoindre-le-groupe/adhesion">Comment ça marche</Button>
          </div>
        </Reveal>
      </section>
    </main>
  );
}
