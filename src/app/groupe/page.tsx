import type { Metadata } from "next";
import { seoFor } from "@/lib/server/site";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { getGroupPhotos } from "@/lib/server/site";
import { getCms } from "@/lib/server/cms";
import { GroupHero } from "@/components/group/GroupHero";
import { wrap } from "@/components/histoire/styles";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { chapters } from "@/data/chapters";
import { JoinGate } from "@/components/member/JoinGate";

export async function generateMetadata(): Promise<Metadata> {
  return seoFor("/groupe", { title: "Le groupe", description: "Les Dames du Parc : 22 supportrices réunies par la même passion, le Paris Saint-Germain. Notre histoire, nos valeurs, pourquoi un fan club 100 % féminin, ce que nous voulons construire." });
}

export default async function GroupPage() {
  const [photos, cms] = await Promise.all([getGroupPhotos(), getCms()]);
  return (
    <main className="overflow-x-clip">
      <GroupHero title={cms.t("groupe.titre", "Les Dames\ndu Parc")} intro={cms.t("groupe.intro", "Une communauté de supportrices réunies par la même passion : le Paris Saint-Germain.")} button={cms.t("groupe.bouton", "Lire notre histoire")} />

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
                  className="group relative flex h-full min-w-0 flex-col overflow-hidden rounded-[10px] border border-line bg-night-900/85 transition-[border-color,background-color,transform] duration-500 hover:-translate-y-1 hover:border-psg-red-bright/50 hover:bg-night-800"
                >
                  <div className="relative aspect-[16/10] w-full overflow-hidden bg-night-900">
                    <Image
                      src={photos[c.slug].src}
                      alt=""
                      fill
                      unoptimized={photos[c.slug].src.startsWith("/medias/") || photos[c.slug].src.startsWith("http")}
                      sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 100vw"
                      className="object-cover saturate-[0.85] transition-transform duration-[1200ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.06]"
                    />
                    <div aria-hidden className="absolute inset-0 bg-[linear-gradient(180deg,rgba(3,9,25,0)_40%,rgba(3,9,25,0.75)_100%)]" />
                    <span className="absolute bottom-3 left-4 font-display text-[28px] leading-none tabular-nums text-white/90">{c.number ?? "·"}</span>
                  </div>
                  <div className="relative flex min-w-0 flex-1 flex-col gap-3 p-6">
                    <h3 className="break-words font-display text-[clamp(17px,1.5vw,21px)] uppercase leading-[1.15] text-white">{c.title}</h3>
                    <p className="line-clamp-3 break-words text-mist t-small">{c.sub}</p>
                  </div>
                  <span aria-hidden className="absolute bottom-5 right-5 grid size-9 place-items-center rounded-full border border-white/15 text-white/60 transition-[transform,color,border-color] duration-300 group-hover:translate-x-1 group-hover:border-psg-red-bright group-hover:text-white">
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
            <JoinGate><Button size="lg" href="/rejoindre-le-groupe">Devenir membre</Button></JoinGate>
            <Button size="lg" variant="outline" href="/rejoindre-le-groupe/adhesion">Comment ça marche</Button>
          </div>
        </Reveal>
      </section>
    </main>
  );
}
