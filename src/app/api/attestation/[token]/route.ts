import { getSession } from "@/lib/server/session";
import { getAdmin } from "@/lib/server/admin-auth";
import { getMemberByToken, toPublic } from "@/lib/server/store";
import { buildAttestation } from "@/lib/server/pdf";
import { siteUrl } from "@/lib/server/http";
import { settings } from "@/lib/server/admin-store";
import { membershipState } from "@/lib/server/business";

/** Attestation d'adhésion en PDF : la titulaire (connectée) ou un administrateur. */
export async function GET(req: Request, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params;
  const [session, stored, admin] = await Promise.all([getSession(), getMemberByToken(token), getAdmin()]);
  const allowed = Boolean(admin?.can("members.pii")) || (session?.role === "member" && stored?.memberNumber === session.memberNumber);
  if (!stored || !allowed) return new Response("Introuvable.", { status: 404 });
  const member = toPublic(stored);
  // L'attestation n'est délivrée qu'une fois l'adhésion validée (paiement reçu) : les administratrices peuvent toujours l'éditer.
  if (!admin?.can("members.pii") && (await membershipState(stored.id)) !== "active") return new Response("Adhésion en cours de création : l'attestation sera disponible dès la validation du paiement.", { status: 403 });
  const bytes = await buildAttestation(member, `${siteUrl(req)}/verification/${member.token}`, (await settings.get()).association);
  return new Response(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="attestation-adhesion-${member.memberNumber}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
