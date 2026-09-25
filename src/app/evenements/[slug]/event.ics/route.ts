import { allEvents, getEvent } from "@/data/events";
import { buildIcs, icsHeaders } from "@/lib/ics";

export const dynamic = "force-static";

export function generateStaticParams() {
  return allEvents().map((e) => ({ slug: e.id }));
}

export async function GET(_req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const event = getEvent(slug);
  if (!event) return new Response("Événement introuvable", { status: 404 });
  return new Response(buildIcs([event]), { headers: icsHeaders(`${event.id}.ics`) });
}
