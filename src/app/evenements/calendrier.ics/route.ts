import { getUpcomingEvents } from "@/lib/server/events";
import { buildIcs, icsHeaders } from "@/lib/ics";

export const revalidate = 3600;

export async function GET() {
  return new Response(buildIcs(await getUpcomingEvents()), { headers: icsHeaders("dames-du-parc-agenda.ics") });
}
