import { getSession } from "@/lib/server/session";
import { listRegistrations } from "@/lib/server/store";
import { ticketPdfFor, ticketValid } from "@/lib/server/tickets";

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
