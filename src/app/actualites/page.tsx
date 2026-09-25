import type { Metadata } from "next";
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

export default async function NewsPage() {
  const news = await getPublishedNews();
  const [featured, ...rest] = news;
  return (
    <main className="overflow-x-clip">
      <section className="relative isolate px-[var(--gutter)] pb-24 pt-[200px] text-center md:pb-32 md:pt-[270px]">
        <div aria-hidden className="pointer-events-none absolute left-1/2 top-[300px] -z-10 -translate-x-1/2 -translate-y-1/2 md:top-[330px]">
          <div className="absolute left-1/2 top-1/2 size-[min(140vw,1000px)] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/[0.05] bg-[radial-gradient(circle,rgba(24,52,128,0.22),transparent_68%)]" />
          <div className="absolute left-1/2 top-1/2 size-[min(90vw,620px)] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/[0.07] bg-[radial-gradient(circle,rgba(217,15,44,0.12),transparent_70%)]" />
        </div>
        <h1 className="t-display">Actualités</h1>
        <p className="mx-auto mt-8 max-w-md text-mist t-lead">Matchs, déplacements, portraits et coulisses : la vie des Dames du Parc, aux couleurs de Paris.</p>
      </section>

      <div className="mx-auto max-w-[1240px] px-[var(--gutter)]">
        <Reveal>
          <FeaturedNews item={featured} />
        </Reveal>

        <Reveal className="mt-24 grid gap-14 border-b border-white/10 pb-16 md:mt-32 lg:grid-cols-[1fr_260px] lg:gap-20">
          <div>
            <h2 className="font-body text-[20px] font-medium tracking-[-0.01em] text-white md:text-[22px]">Prolongez l&rsquo;expérience</h2>
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

        <ul className="mt-20 grid gap-8 pb-32 sm:grid-cols-2 md:mt-28 lg:grid-cols-3 lg:gap-10 md:pb-44">
          {rest.map((item, i) => (
            <li key={item.id}>
              <Reveal delay={(i % 3) * 0.06} className="h-full">
                <NewsCard item={item} />
              </Reveal>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
