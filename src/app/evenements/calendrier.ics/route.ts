import { events } from "@/data/events";
import { buildIcs, icsHeaders } from "@/lib/ics";

export const dynamic = "force-static";

export function GET() {
  return new Response(buildIcs(events), { headers: icsHeaders("dames-du-parc-agenda.ics") });
}
