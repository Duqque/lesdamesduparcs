import { Fragment, type ReactNode } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Hero } from "@/components/hero/Hero";
import { Manifesto } from "@/components/manifesto/Manifesto";
import { MatchCard } from "@/components/matches/MatchCard";
import { EventCard } from "@/components/events/EventCard";
import { CommunityCard } from "@/components/community/CommunityCard";
import { QuoteSection } from "@/components/community/QuoteSection";
import { ShopCard } from "@/components/shop/ShopCard";
import { NewsCard } from "@/components/news/NewsCard";
import { ChantPlayer } from "@/components/chants/ChantPlayer";
import { ChantsBanner } from "@/components/chants/ChantsBanner";
import { PhotoGallery } from "@/components/gallery/PhotoGallery";
import { Reveal } from "@/components/ui/Reveal";
import { nextMatch } from "@/data/matches";
import { getEvent, getUpcomingEvents } from "@/lib/server/events";
import { getPublishedNews, siteConfig } from "@/lib/server/content";
import { community } from "@/data/community";
import { orderHomeSections, type HomeSectionKey } from "@/data/home-sections";
import { quote } from "@/data/chants";
import { gallery } from "@/data/gallery";

const label = "t-eyebrow";
const h2 = "mt-4 t-h2";
const wrap = "mx-auto w-full max-w-[1300px] px-[var(--gutter)]";

/*
 * Accueil : une seule colonne de rubriques qui apparaissent au fil du scroll.
 * L'espace membre n'est plus affiché ici : il s'ouvre depuis l'icône de profil du header.
 */
export default async function HomePage() {
  const [home, upcoming, allNews] = await Promise.all([siteConfig.get().then((c) => c.home), getUpcomingEvents(), getPublishedNews()]);
  const pinned = await Promise.all([...home.featuredEventIds, "soiree-des-dames"].map((id) => getEvent(id)));
  const featuredEvent = pinned.find((e) => e && e.date >= new Date().toISOString().slice(0, 10)) ?? upcoming[0] ?? null;
  const news = [...home.featuredArticleIds.map((id) => allNews.find((n) => n.id === id)).filter((n): n is NonNullable<typeof n> => Boolean(n)), ...allNews.filter((n) => !home.featuredArticleIds.includes(n.id))];
  const blocks: Record<HomeSectionKey, ReactNode> = {
    manifeste: <Manifesto />,
    rendezvous: (
      <section aria-label="Prochains rendez-vous" className={`${wrap} grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-8`}>
        <Reveal className="flex md:col-span-3">
          <MatchCard match={nextMatch} />
        </Reveal>
        <Reveal delay={0.08} className="flex">
          {featuredEvent ? <EventCard event={featuredEvent} /> : <CommunityCard community={community} />}
        </Reveal>
        <Reveal delay={0.16} className="flex">
          <CommunityCard community={community} />
        </Reveal>
        <Reveal delay={0.24} className="flex">
          <ShopCard />
        </Reveal>
      </section>
    ),
    citation: (
      <div className={`${wrap} mt-6 grid grid-cols-1 gap-6 md:mt-8 md:grid-cols-[1fr_1.2fr] md:gap-8`}>
        <Reveal className="flex">
          <QuoteSection text={quote.text} image={quote.image} />
        </Reveal>
        <Reveal delay={0.1} className="flex">
          <ChantsBanner />
        </Reveal>
      </div>
    ),
    chant: (
      <section aria-labelledby="chant-title" className={`${wrap} pt-32 md:pt-48`}>
        <div className="grid grid-cols-[minmax(0,1fr)] items-center gap-12 md:grid-cols-[1fr_minmax(0,520px)] md:gap-24">
          <Reveal>
            <p className={label}>À écouter</p>
            <h2 id="chant-title" className={h2}>
              Le chant du groupe
            </h2>
            <p className="mt-6 max-w-md text-white/75 t-lead">Un refrain qui se transmet de tribune en tribune. Lancez la musique, apprenez les paroles, chantez avant de rejoindre le Parc.</p>
          </Reveal>
          <Reveal delay={0.1}>
            <ChantPlayer />
          </Reveal>
        </div>
      </section>
    ),
    actus: (
      <section aria-labelledby="actus-title" className={`${wrap} pt-32 md:pt-48`}>
        <Reveal className="flex items-end justify-between gap-6">
          <div>
            <p className={label}>À la une</p>
            <h2 id="actus-title" className={h2}>
              Actualités
            </h2>
          </div>
          <Link href="/actualites" className="group hidden min-h-11 items-center gap-2 font-body text-[13.5px] font-medium text-white/80 transition-colors hover:text-white sm:inline-flex">
            Toutes les actualités <ArrowRight aria-hidden className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </Reveal>
        <ul className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3 lg:gap-10">
          {news.slice(0, 3).map((item, i) => (
            <li key={item.id}>
              <Reveal delay={i * 0.08} className="h-full">
                <NewsCard item={item} />
              </Reveal>
            </li>
          ))}
        </ul>
      </section>
    ),
    galerie: <PhotoGallery photos={gallery.slice(0, 5)} compact />,
  };

  return (
    <main>
      <Hero title={home.heroTitle || undefined} subtitle={home.heroSubtitle || undefined} cta={home.heroCta || undefined} />
      {orderHomeSections(home.sectionOrder, home.hiddenSections).map((k) => (
        <Fragment key={k}>{blocks[k]}</Fragment>
      ))}
    </main>
  );
}
