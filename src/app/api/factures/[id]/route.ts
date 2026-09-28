import { getAdmin } from "@/lib/server/admin-auth";
import { getBlob } from "@/lib/server/blobs";
import { invoiceKey, invoices } from "@/lib/server/invoice";
import { getSession } from "@/lib/server/session";

/** Télécharge une facture (PDF) : la personne concernée, connectée, ou une administratrice habilitée (finances ou fiches adhérentes). */
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const inv = await invoices.findOne((i) => i.id === id);
  if (!inv) return new Response("Introuvable.", { status: 404 });
  const [session, admin] = await Promise.all([getSession(), getAdmin()]);
  const allowed = Boolean(admin?.can("finance.view") || admin?.can("members.view")) || (session?.role === "member" && !!inv.memberNumber && inv.memberNumber === session.memberNumber);
  if (!allowed) return new Response("Introuvable.", { status: 404 });
  const blob = await getBlob(invoiceKey(inv.id));
  if (!blob) return new Response("Introuvable.", { status: 404 });
  return new Response(new Uint8Array(blob.bytes), {
    headers: { "Content-Type": "application/pdf", "Content-Disposition": `inline; filename="facture-${inv.number}.pdf"`, "Cache-Control": "private, no-store" },
  });
}
