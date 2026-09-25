import { getEvent } from "@/lib/server/events";
import { getAdmin } from "@/lib/server/admin-auth";
import { json } from "@/lib/server/http";
import { listRegistrations, takenPlaces } from "@/lib/server/store";

/** Liste des inscriptions : réservée aux administrateurs. */
export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const admin = await getAdmin();
  if (!admin?.can("events.attendance")) return json({ error: "Accès réservé aux administrateurs." }, 403);
  const { slug } = await params;
  const event = await getEvent(slug);
  if (!event) return json({ error: "Événement introuvable." }, 404);
  const list = await listRegistrations(slug);
  return json({
    capacity: event.registration.capacity,
    taken: takenPlaces(list),
    collectedCents: list.filter((r) => r.status === "paid").reduce((n, r) => n + r.amountCents, 0),
    registrations: list.sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
  });
}
