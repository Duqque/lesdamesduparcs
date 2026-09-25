import { Hero } from "@/components/hero/Hero";
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
import { currentMember, memberMenu } from "@/data/members";
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
    <main className="mx-auto grid max-w-[1800px] grid-cols-1 gap-3.5 px-[var(--gutter)] pb-8 md:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_clamp(290px,19.4vw,340px)] xl:items-start xl:gap-x-[clamp(16px,1.4vw,24px)] xl:gap-y-0 xl:px-0 xl:pb-0 xl:pr-[1.5vw]">
      <div className="contents xl:flex xl:min-w-0 xl:flex-col xl:gap-[14px]">
        <div className="order-1 col-span-full -mx-[var(--gutter)] xl:mx-0">
          <Hero />
        </div>

        <div className="order-3 col-span-full grid grid-cols-1 gap-3.5 md:order-2 md:grid-cols-3 xl:grid-cols-[minmax(0,1.99fr)_minmax(0,1.05fr)_minmax(0,1.05fr)_minmax(0,1fr)] xl:pl-[var(--gutter)]">
          <Reveal className="flex md:col-span-3 xl:col-span-1">
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

        <div className="order-6 col-span-full grid grid-cols-1 gap-3.5 md:grid-cols-[1fr_1.2fr] xl:grid-cols-[minmax(0,0.98fr)_minmax(0,1.02fr)] xl:pl-[var(--gutter)]">
          <Reveal className="flex">
            <QuoteSection text={quote.text} image={quote.image} />
          </Reveal>
          <Reveal delay={0.1} className="flex">
            <ChantsBanner />
          </Reveal>
        </div>
      </div>

      <div className="contents xl:flex xl:flex-col xl:gap-[14px] xl:pt-[calc(76px+14px)]">
        <Reveal className="order-2 md:order-3 md:col-span-2 xl:col-span-1">
          <MemberPanel user={currentMember} menu={memberMenu} />
        </Reveal>
        <Reveal delay={0.1} className="order-4 md:col-span-2 xl:col-span-1">
          <ChantPlayer />
        </Reveal>
        <Reveal delay={0.2} className="order-5 md:col-span-2 xl:col-span-1">
          <NewsList items={news} />
        </Reveal>
      </div>
    </main>
    <PhotoGallery photos={gallery} />
    </>
  );
}
