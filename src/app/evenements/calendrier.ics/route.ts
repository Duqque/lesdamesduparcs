import { getUpcomingEvents } from "@/lib/server/events";
import { getUpcomingMatchViews } from "@/lib/server/matches";
import type { ClubEvent } from "@/types";
import { buildIcs, icsHeaders } from "@/lib/ics";

export const revalidate = 3600;

export async function GET() {
  const [events, matches] = await Promise.all([getUpcomingEvents(), getUpcomingMatchViews(80)]);
  // Les matchs du PSG figurent dans l'agenda comme des événements (durée de 2 h).
  const asEvents = matches.map((m) => {
    const time = m.time || "20:00";
    const [h, min] = time.split(":").map(Number);
    return { id: `match-${m.id}`, title: `${m.isHome ? "PSG" : m.opponent} – ${m.isHome ? m.opponent : "PSG"} (${m.competition || "match"})`, date: m.date, time, endTime: `${String((h + 2) % 24).padStart(2, "0")}:${String(min).padStart(2, "0")}`, venue: m.stadium, address: "", summary: `Match du PSG. Billetterie : ${m.ticketHref}`, } as unknown as ClubEvent;
  });
  return new Response(buildIcs([...events, ...asEvents].sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`))), { headers: icsHeaders("dames-du-parc-agenda.ics") });
}
