import { getSession } from "@/lib/server/session";
import { getMemberByToken, toPublic } from "@/lib/server/store";
import { buildAttestation } from "@/lib/server/pdf";
import { siteUrl } from "@/lib/server/http";

/** Attestation d'adhésion en PDF : la titulaire (connectée) ou un administrateur. */
export async function GET(req: Request, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params;
  const [session, stored] = await Promise.all([getSession(), getMemberByToken(token)]);
  const allowed = session?.role === "admin" || (session?.role === "member" && stored?.memberNumber === session.memberNumber);
  if (!stored || !allowed) return new Response("Introuvable.", { status: 404 });
  const member = toPublic(stored);
  const bytes = await buildAttestation(member, `${siteUrl(req)}/verification/${member.token}`);
  return new Response(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="attestation-adhesion-${member.memberNumber}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
