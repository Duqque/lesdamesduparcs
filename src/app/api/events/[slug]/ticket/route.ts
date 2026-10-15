import { getSession } from "@/lib/server/session";
import { listRegistrations } from "@/lib/server/store";
import { reactivateTicket, ticketPdfFor, ticketValid } from "@/lib/server/tickets";
import { json, throttled } from "@/lib/server/http";

/** Billet PDF de la membre connectée pour cet événement (inscription confirmée ou payée). */
export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const session = await getSession();
  if (!session || session.role !== "member") return new Response("Connectez-vous pour télécharger votre billet.", { status: 401 });
  const mine = (await listRegistrations(slug)).find((r) => r.memberNumber === session.memberNumber && ticketValid(r));
  if (!mine) return new Response("Aucun billet pour cet événement.", { status: 404 });
  const t = await ticketPdfFor(mine.id);
  if (!t) return new Response("Billet indisponible.", { status: 404 });
  return new Response(Buffer.from(t.bytes), { headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="${t.filename}"`, "Cache-Control": "no-store" } });
}

/** Redemande d'un billet annulé mais déjà payé (jusqu'à 2 h avant l'événement, s'il reste de la place). */
export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const session = await getSession();
  if (!session || session.role !== "member") return json({ error: "Connectez-vous pour redemander votre billet." }, 401);
  if (await throttled(req, "ticket-reactivate", 10, 600_000, session.memberNumber)) return json({ error: "Trop de tentatives." }, 429);
  const reg = (await listRegistrations(slug)).find((r) => r.memberNumber === session.memberNumber && r.status === "cancelled" && r.paidBeforeCancel);
  if (!reg) return json({ error: "Aucun billet annulé à redemander pour cet événement." }, 404);
  const res = await reactivateTicket(reg.id);
  if (!res.ok) return json({ error: res.error }, 409);
  return json({ ok: true, message: `Votre nouveau billet (n° ${res.code}) est prêt${res.sent ? " et vous a été envoyé par e-mail" : ""}. Téléchargez-le ci-dessous.` });
}
