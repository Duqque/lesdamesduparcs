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
import { featuredEvent } from "@/data/events";
import { community } from "@/data/community";
import { news } from "@/data/news";
import { quote } from "@/data/chants";
import { gallery } from "@/data/gallery";

const label = "t-eyebrow";
const h2 = "mt-4 t-h2";
const wrap = "mx-auto w-full max-w-[1300px] px-[var(--gutter)]";

/*
 * Accueil : une seule colonne de rubriques qui apparaissent au fil du scroll.
 * L'espace membre n'est plus affiché ici : il s'ouvre depuis l'icône de profil du header.
 */
export default function HomePage() {
  return (
    <>
      <main className="pt-[calc(72px+48px)] md:pt-[calc(var(--header-h)+64px)] xl:pt-[calc(var(--header-h)+clamp(72px,7vw,132px))]">
        <Hero />

        <Manifesto />

        <section aria-label="Prochains rendez-vous" className={`${wrap} grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-8`}>
          <Reveal className="flex md:col-span-3">
            <MatchCard match={nextMatch} />
          </Reveal>
          <Reveal delay={0.08} className="flex">
            <EventCard event={featuredEvent} />
          </Reveal>
          <Reveal delay={0.16} className="flex">
            <CommunityCard community={community} />
          </Reveal>
          <Reveal delay={0.24} className="flex">
            <ShopCard />
          </Reveal>
        </section>

        <div className={`${wrap} mt-6 grid grid-cols-1 gap-6 md:mt-8 md:grid-cols-[1fr_1.2fr] md:gap-8`}>
          <Reveal className="flex">
            <QuoteSection text={quote.text} image={quote.image} />
          </Reveal>
          <Reveal delay={0.1} className="flex">
            <ChantsBanner />
          </Reveal>
        </div>

        <section aria-labelledby="chant-title" className={`${wrap} pt-32 md:pt-48`}>
          <div className="grid items-center gap-12 md:grid-cols-[1fr_minmax(0,520px)] md:gap-24">
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
      </main>
      <PhotoGallery photos={gallery.slice(0, 5)} compact />
    </>
  );
}
