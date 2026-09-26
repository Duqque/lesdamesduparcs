import { psgMatches } from "@/lib/server/matches";
import { matchTitle } from "@/lib/matches";
import { EventForm } from "@/components/admin/EventForm";
import { Flash, PageHeader } from "@/components/admin/ui";
import { first, type SP } from "@/lib/admin/params";
import { requireAdmin } from "@/lib/server/admin-auth";

export const metadata = { title: "Créer un événement" };

export default async function NewEventPage({ searchParams }: { searchParams: Promise<SP> }) {
  const ctx = await requireAdmin("events.edit");
  const sp = await searchParams;
  const today = new Date().toISOString().slice(0, 10);
  const allMatches = (await psgMatches.all()).filter((m) => m.date >= today).sort((a, b) => a.date.localeCompare(b.date));
  const matchOptions = allMatches.map((m) => ({ id: m.id, label: `${m.date} · ${matchTitle(m)}${m.competition ? ` (${m.competition})` : ""}` }));
  return (
    <>
      <PageHeader back={{ href: "/admin/evenements", label: "Tous les événements" }} title="Créer un événement" />
      <Flash error={first(sp.erreur)} />
      <EventForm canPricing={ctx.can("events.pricing")} matches={matchOptions} />
    </>
  );
}
