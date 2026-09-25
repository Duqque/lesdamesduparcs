import type { Metadata } from "next";
import { EventCarousel } from "@/components/events/EventCarousel";
import { events, highlightedEventId } from "@/data/events";

export const metadata: Metadata = {
  title: "Événements",
  description: "Le calendrier des Dames du Parc : matchs, soirées, ateliers, rencontres et déplacements. Faites défiler les événements de la saison.",
};

export default function EventsPage() {
  const sorted = [...events].sort((a, b) => a.date.localeCompare(b.date));
  return (
    <main className="overflow-x-clip">
      <EventCarousel events={sorted} startId={highlightedEventId} />
    </main>
  );
}
