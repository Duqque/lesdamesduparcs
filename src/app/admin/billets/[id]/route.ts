import { redirectTo } from "@/lib/server/http";
import { getAdmin } from "@/lib/server/admin-auth";
import { ticketPdfFor } from "@/lib/server/tickets";

/** Billet PDF d'une inscription, pour l'équipe (liste des inscrits). */
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const admin = await getAdmin();
  if (!admin) return redirectTo("/admin/connexion");
  if (!admin.can("events.attendance")) return new Response("Accès refusé.", { status: 403 });
  const { id } = await ctx.params;
  const t = await ticketPdfFor(id);
  if (!t) return new Response("Billet indisponible : l'inscription n'est pas confirmée ou payée.", { status: 404 });
  return new Response(Buffer.from(t.bytes), { headers: { "Content-Type": "application/pdf", "Content-Disposition": `inline; filename="${t.filename}"`, "Cache-Control": "no-store" } });
}
