import type { Metadata } from "next";
import Link from "next/link";
import { Download } from "lucide-react";
import { EventGridCard } from "@/components/events/EventGridCard";
import { PastEvents } from "@/components/events/PastEvents";
import { allEvents, isPast } from "@/data/events";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Événements",
  description: "Les événements des Dames du Parc : matchs, soirées, ateliers, rencontres et déplacements, à venir et passés.",
};

export default function EventsPage() {
  const all = allEvents();
  const upcoming = all.filter((e) => !isPast(e)).sort((a, b) => a.date.localeCompare(b.date));
  const past = all.filter((e) => isPast(e)).sort((a, b) => b.date.localeCompare(a.date));

  return (
    <main className="relative overflow-x-clip pb-40 pt-[190px] md:pt-[240px]">
      <div className="mx-auto max-w-[1300px] px-[var(--gutter)]">
        <div className="relative">

          <nav aria-label="Fil d'Ariane" className="font-body text-[13px] text-mist">
            <Link href="/" className="hover:text-white">Accueil</Link> / <span className="text-white/80">Événements</span>
          </nav>
          <h1 className="mt-10 md:mt-16 t-display">Événements</h1>
          <p className="mt-8 max-w-md text-white/75 t-lead">
            Matchs au Parc, soirées, ateliers et déplacements : les rendez-vous des Dames du Parc se succèdent tout au long de la saison.
          </p>
          <Link href="/evenements/calendrier.ics" prefetch={false} className="mt-6 inline-flex min-h-11 items-center gap-2 font-body text-[13px] font-medium text-white/80 hover:text-white">
            <Download aria-hidden className="size-4" strokeWidth={1.8} /> Ajouter à mon agenda
          </Link>
        </div>

        <section aria-labelledby="upcoming" className="mt-24 md:mt-32">
          <h2 id="upcoming" className="font-body text-[20px] font-medium text-white">Prochains événements</h2>
          <ul className="mt-10 -mx-[var(--gutter)] flex snap-x gap-4 overflow-x-auto px-[var(--gutter)] pb-4 [scrollbar-width:none] md:mx-0 md:grid md:grid-cols-2 md:gap-6 md:overflow-visible md:px-0 lg:grid-cols-4 [&::-webkit-scrollbar]:hidden">
            {upcoming.map((e) => (
              <li key={e.id} className="contents md:block">
                <EventGridCard event={e} />
              </li>
            ))}
          </ul>
        </section>

        {past.length > 0 && (
          <section aria-labelledby="past" className="mt-28 md:mt-40">
            <h2 id="past" className="font-body text-[20px] font-medium text-white">Événements passés</h2>
            <div className="mt-10">
              <PastEvents events={past} />
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
