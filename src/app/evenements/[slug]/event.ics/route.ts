import { getEvent, getPublishedEvents } from "@/lib/server/events";
import { buildIcs, icsHeaders } from "@/lib/ics";

export const revalidate = 3600;

export async function generateStaticParams() {
  return (await getPublishedEvents()).map((e) => ({ slug: e.id }));
}

export async function GET(_req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const event = await getEvent(slug);
  if (!event) return new Response("Événement introuvable", { status: 404 });
  return new Response(buildIcs([event]), { headers: icsHeaders(`${event.id}.ics`) });
}
