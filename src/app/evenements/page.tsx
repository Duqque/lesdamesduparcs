import type { Metadata } from "next";
import { ScheduleBoard } from "@/components/events/ScheduleBoard";
import { events, highlightedEventId } from "@/data/events";
import { membership } from "@/data/membership";

export const metadata: Metadata = {
  title: "Événements",
  description: "Le calendrier des Dames du Parc : matchs, soirées, ateliers, rencontres et déplacements. Faites défiler les événements de la saison.",
};

export default function EventsPage() {
  const sorted = [...events].sort((a, b) => a.date.localeCompare(b.date));
  return (
    <main className="overflow-x-clip">
      <ScheduleBoard events={sorted} highlightedId={highlightedEventId} season={membership.season} />
    </main>
  );
}
