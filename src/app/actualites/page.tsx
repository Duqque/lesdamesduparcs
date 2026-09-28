import type { Metadata } from "next";
import Link from "next/link";
import { getCms } from "@/lib/server/cms";
import { seoFor } from "@/lib/server/site";
import { DiscreetLinks } from "@/components/news/DiscreetLinks";
import { FeaturedNews } from "@/components/news/FeaturedNews";
import { NewsCard } from "@/components/news/NewsCard";
import { Reveal } from "@/components/ui/Reveal";
import { socialLinks } from "@/data/navigation";
import { socialIcons } from "@/components/icons/BrandIcons";
import { getPublishedNews } from "@/lib/server/content";

export async function generateMetadata(): Promise<Metadata> {
  return seoFor("/actualites", { title: "Actualités", description: "Les actualités des Dames du Parc : matchs, déplacements, portraits et vie de l'association, aux couleurs du Paris Saint-Germain." });
}

export const revalidate = 300;

export default async function NewsPage({ searchParams }: { searchParams: Promise<{ tag?: string }> }) {
  const { tag } = await searchParams;
  const [all, cms] = await Promise.all([getPublishedNews(), getCms()]);
  const news = tag ? all.filter((n) => n.tags?.some((t) => t.toLowerCase() === tag.toLowerCase())) : all;
  const [featured, ...rest] = news;
  return (
    <main className="overflow-x-clip">
      <section className="relative isolate px-[var(--gutter)] pb-24 pt-[200px] text-center md:pb-32 md:pt-[270px]">
        <div aria-hidden className="pointer-events-none absolute left-1/2 top-[300px] -z-10 -translate-x-1/2 -translate-y-1/2 md:top-[330px]">
          <div className="absolute left-1/2 top-1/2 size-[min(140vw,1000px)] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/[0.05] bg-[radial-gradient(circle,rgba(24,52,128,0.22),transparent_68%)]" />
          <div className="absolute left-1/2 top-1/2 size-[min(90vw,620px)] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/[0.07] bg-[radial-gradient(circle,rgba(217,15,44,0.12),transparent_70%)]" />
        </div>
        <h1 className="t-display">{cms.t("actualites.titre", "Actualités")}</h1>
        <p className="mx-auto mt-8 max-w-md text-mist t-lead">{cms.t("actualites.intro", "Matchs, déplacements, portraits et coulisses : la vie des Dames du Parc, aux couleurs de Paris.")}</p>
      </section>

      <div className="mx-auto max-w-[1240px] px-[var(--gutter)]">
        {tag && (
          <p className="mb-10 flex flex-wrap items-center gap-3 font-body text-[15px] text-white">
            Articles avec le tag <strong className="rounded-full border border-psg-red-bright/60 px-3 py-1">#{tag}</strong>
            <Link href="/actualites" className="text-mist underline decoration-white/30 underline-offset-4 hover:text-white">Voir tous les articles</Link>
          </p>
        )}
        {featured ? (
        <Reveal>
          <FeaturedNews item={featured} />
        </Reveal>
        ) : (
          <p className="font-body text-[16px] text-mist">Aucun article pour ce tag pour le moment.</p>
        )}

        <ul className="mt-20 grid gap-8 pb-24 sm:grid-cols-2 md:mt-28 lg:grid-cols-3 lg:gap-10 md:pb-32">
          {rest.map((item, i) => (
            <li key={item.id}>
              <Reveal delay={(i % 3) * 0.06} className="h-full">
                <NewsCard item={item} />
              </Reveal>
            </li>
          ))}
        </ul>
        <Reveal className="mb-32 grid gap-14 border-t border-white/10 pt-16 md:mb-44 lg:grid-cols-[1fr_260px] lg:gap-20">
          <div>
            <h2 className="font-body text-[20px] font-medium tracking-[-0.01em] text-white md:text-[22px]">{cms.t("actualites.prolonger", "Prolongez l’expérience")}</h2>
            <DiscreetLinks className="mt-10" />
          </div>
          <div className="lg:border-l lg:border-white/10 lg:pl-10">
            <h2 className="font-body text-[20px] font-medium tracking-[-0.01em] text-white md:text-[22px]">Suivez-nous</h2>
            <p className="mt-3 text-mist t-small">Les coulisses du groupe et de l&rsquo;actualité parisienne.</p>
            <ul className="mt-6 flex gap-1">
              {socialLinks.map((s) => {
                const Icon = socialIcons[s.id];
                return (
                  <li key={s.id}>
                    <a href={s.href} aria-label={s.label} target="_blank" rel="noopener noreferrer" className="grid size-11 place-items-center rounded-[10px] text-white/75 transition-colors hover:bg-white/10 hover:text-white">
                      <Icon className="size-[18px]" />
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        </Reveal>

      </div>
    </main>
  );
}
