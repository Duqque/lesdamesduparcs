import { readFile } from "node:fs/promises";
import { getSession } from "@/lib/server/session";
import { getAdmin } from "@/lib/server/admin-auth";
import { authorizationPath, getMemberByToken } from "@/lib/server/store";

/** Autorisation parentale déposée : consultable par les administrateurs et par la titulaire du compte. */
export async function GET(_req: Request, ctx: { params: Promise<{ token: string; fileId: string }> }) {
  const { token, fileId } = await ctx.params;
  const [session, member, admin] = await Promise.all([getSession(), getMemberByToken(token), getAdmin()]);
  const allowed = Boolean(admin?.can("members.pii")) || (session?.role === "member" && member?.memberNumber === session.memberNumber);
  const doc = member?.authorizations.find((f) => f.id === fileId);
  if (!member || !doc || !allowed) return new Response("Introuvable.", { status: 404 });
  try {
    const bytes = await readFile(authorizationPath(member.id, doc.id));
    return new Response(bytes, {
      headers: { "Content-Type": "application/pdf", "Content-Disposition": `inline; filename="${encodeURIComponent(doc.name)}"`, "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" },
    });
  } catch {
    return new Response("Fichier introuvable.", { status: 404 });
  }
}
