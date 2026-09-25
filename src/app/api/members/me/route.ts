import { json, siteUrl } from "@/lib/server/http";
import { getSession } from "@/lib/server/session";
import { getMemberByNumber, listOrdersByMember, listRegistrationsByMember, toPublic } from "@/lib/server/store";
import { events } from "@/data/events";

/** Espace de la membre connectée : fiche, lien de vérification, commandes et inscriptions. */
export async function GET(req: Request) {
  const s = await getSession();
  if (s?.role !== "member") return json({ error: "Non connectée." }, 401);
  const stored = await getMemberByNumber(s.memberNumber);
  if (!stored) return json({ error: "Compte introuvable." }, 404);
  const member = toPublic(stored);
  const [orders, registrations] = await Promise.all([listOrdersByMember(member.memberNumber), listRegistrationsByMember(member.memberNumber)]);
  return json({
    member: { ...member, authorizations: member.authorizations.map((f) => ({ id: f.id, name: f.name })) },
    verifyUrl: `${siteUrl(req)}/verification/${member.token}`,
    orders: orders.map((o) => ({ id: o.id, createdAt: o.createdAt, status: o.status, totalCents: o.totalCents, items: o.lines.reduce((n, l) => n + l.qty, 0), label: o.lines.map((l) => `${l.qty} × ${l.name}${l.size ? ` (${l.size})` : ""}`).join(", ") })),
    registrations: registrations.map((r) => ({ id: r.id, eventId: r.eventId, title: events.find((e) => e.id === r.eventId)?.title ?? r.eventId, createdAt: r.createdAt, status: r.status, amountCents: r.amountCents, places: r.places })),
  });
}
