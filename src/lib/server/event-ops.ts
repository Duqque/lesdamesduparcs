import "server-only";
import { formatLongDate } from "@/lib/format";
import { sendTemplate } from "./email";
import { getEventAdmin } from "./events";
import { listAllRegistrations, takenPlaces, updateRegistration } from "./store";

/** Après une annulation : propose automatiquement les places libérées aux premières personnes de la liste d'attente. */
export async function promoteWaitlist(eventId: string) {
  const ev = await getEventAdmin(eventId);
  if (!ev) return 0;
  const all = (await listAllRegistrations()).filter((r) => r.eventId === eventId);
  let remaining = Math.max(ev.registration.capacity - takenPlaces(all), 0);
  let promoted = 0;
  for (const r of all.filter((x) => x.status === "waitlist").sort((a, b) => a.createdAt.localeCompare(b.createdAt))) {
    if (r.places > remaining) break;
    await updateRegistration(r.id, { status: r.amountCents > 0 ? "awaiting_payment" : "confirmed" });
    await sendTemplate("waitlist", r.email, { prenom: r.firstName, objet: ev.title, date: formatLongDate(ev.date) }, "waitlistNotify");
    remaining -= r.places;
    promoted++;
  }
  return promoted;
}
