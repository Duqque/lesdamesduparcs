import { psgMatches } from "@/lib/server/matches";
import { matchTitle } from "@/lib/matches";
import { notFound } from "next/navigation";
import { EventForm } from "@/components/admin/EventForm";
import { Flash, PageHeader } from "@/components/admin/ui";
import { first, type SP } from "@/lib/admin/params";
import { requireAdmin } from "@/lib/server/admin-auth";
import { getEventAdmin } from "@/lib/server/events";

export const metadata = { title: "Modifier l'événement" };

export default async function EditEventPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<SP> }) {
  const ctx = await requireAdmin("events.edit");
  const { id } = await params;
  const sp = await searchParams;
  const event = await getEventAdmin(id);
  if (!event) notFound();
  const today = new Date().toISOString().slice(0, 10);
  const allMatches = (await psgMatches.all()).filter((m) => m.date >= today).sort((a, b) => a.date.localeCompare(b.date));
  const matchOptions = allMatches.map((m) => ({ id: m.id, label: `${m.date} · ${matchTitle(m)}${m.competition ? ` (${m.competition})` : ""}` }));
  const linked = allMatches.find((m) => m.relatedEventId === event.id)?.id ?? "";
  return (
    <>
      <PageHeader back={{ href: `/admin/evenements/${id}`, label: event.title }} title="Modifier l'événement" />
      <Flash error={first(sp.erreur)} />
      <EventForm event={event} canPricing={ctx.can("events.pricing")} matches={matchOptions} linkedMatchId={linked} />
    </>
  );
}
