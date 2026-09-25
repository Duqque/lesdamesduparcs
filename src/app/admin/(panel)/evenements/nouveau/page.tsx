import { EventForm } from "@/components/admin/EventForm";
import { Flash, PageHeader } from "@/components/admin/ui";
import { first, type SP } from "@/lib/admin/params";
import { requireAdmin } from "@/lib/server/admin-auth";

export const metadata = { title: "Créer un événement" };

export default async function NewEventPage({ searchParams }: { searchParams: Promise<SP> }) {
  await requireAdmin("events.edit");
  const sp = await searchParams;
  return (
    <>
      <PageHeader back={{ href: "/admin/evenements", label: "Tous les événements" }} title="Créer un événement" />
      <Flash error={first(sp.erreur)} />
      <EventForm />
    </>
  );
}
