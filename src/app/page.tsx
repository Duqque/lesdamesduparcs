import { Hero } from "@/components/hero/Hero";
import { Manifesto } from "@/components/manifesto/Manifesto";
import { MemberPanel } from "@/components/member/MemberPanel";
import { MatchCard } from "@/components/matches/MatchCard";
import { EventCard } from "@/components/events/EventCard";
import { CommunityCard } from "@/components/community/CommunityCard";
import { QuoteSection } from "@/components/community/QuoteSection";
import { ShopCard } from "@/components/shop/ShopCard";
import { NewsList } from "@/components/news/NewsList";
import { ChantPlayer } from "@/components/chants/ChantPlayer";
import { ChantsBanner } from "@/components/chants/ChantsBanner";
import { PhotoGallery } from "@/components/gallery/PhotoGallery";
import { Reveal } from "@/components/ui/Reveal";
import { memberMenu } from "@/data/members";
import { nextMatch } from "@/data/matches";
import { featuredEvent } from "@/data/events";
import { community } from "@/data/community";
import { news } from "@/data/news";
import { quote } from "@/data/chants";
import { gallery } from "@/data/gallery";

/*
 * Grille unique, recomposée par breakpoint :
 *  - mobile : 1 colonne (hero → membre → cartes → chant → actus → citation/playlist)
 *  - tablette : 2 colonnes
 *  - xl : colonne principale + colonne latérale, fidèle à la maquette
 * En dessous de xl, les wrappers de colonnes sont en `display: contents` pour que
 * leurs enfants puissent être réordonnés directement dans la grille.
 */
export default function HomePage() {
  return (
    <>
    <main className="mx-auto grid max-w-[1800px] grid-cols-1 gap-6 px-[var(--gutter)] pb-20 pt-[calc(72px+48px)] md:grid-cols-2 md:gap-8 md:pt-[calc(var(--header-h)+64px)] xl:grid-cols-[minmax(0,1fr)_clamp(290px,19.4vw,340px)] xl:items-start xl:gap-x-[clamp(28px,2.6vw,48px)] xl:gap-y-0 xl:px-0 xl:pb-24 xl:pt-[calc(var(--header-h)+clamp(72px,7vw,132px))] xl:pr-[clamp(32px,3.4vw,72px)]">
      <div className="contents xl:flex xl:min-w-0 xl:flex-col xl:gap-[clamp(28px,3vw,56px)]">
        <div className="order-1 col-span-full -mx-[var(--gutter)] xl:order-none xl:mx-0">
          <Hero />
        </div>

        <div className="order-2 col-span-full -mx-[var(--gutter)] xl:order-none xl:mx-0">
          <Manifesto />
        </div>

        <div className="order-4 col-span-full grid grid-cols-1 gap-6 md:order-3 md:grid-cols-3 md:gap-8 xl:order-none xl:pl-[var(--gutter)]">
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
        </div>

        <div className="order-7 col-span-full grid grid-cols-1 gap-6 xl:order-none md:grid-cols-[1fr_1.2fr] md:gap-8 xl:grid-cols-[minmax(0,0.98fr)_minmax(0,1.02fr)] xl:pl-[var(--gutter)]">
          <Reveal className="flex">
            <QuoteSection text={quote.text} image={quote.image} />
          </Reveal>
          <Reveal delay={0.1} className="flex">
            <ChantsBanner />
          </Reveal>
        </div>
      </div>

      <div className="contents xl:flex xl:flex-col xl:gap-[clamp(28px,3vw,56px)] xl:pt-0">
        <Reveal className="order-3 md:order-4 md:col-span-2 xl:order-none xl:col-span-1">
          <MemberPanel menu={memberMenu} />
        </Reveal>
        <Reveal delay={0.1} className="order-5 md:col-span-2 xl:order-none xl:col-span-1">
          <ChantPlayer />
        </Reveal>
        <Reveal delay={0.2} className="order-6 md:col-span-2 xl:order-none xl:col-span-1">
          <NewsList items={news.slice(0, 4)} />
        </Reveal>
      </div>
    </main>
    <PhotoGallery photos={gallery.slice(0, 5)} compact />
    </>
  );
}
