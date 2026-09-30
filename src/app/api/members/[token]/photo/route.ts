import { getSession } from "@/lib/server/session";
import { getAdmin } from "@/lib/server/admin-auth";
import { readPhoto } from "@/lib/server/photo";
import { getMemberByToken } from "@/lib/server/store";

/** Photo de profil : consultable par les administrateurs et par la titulaire du compte, jamais publique. */
export async function GET(_req: Request, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params;
  const [session, member, admin] = await Promise.all([getSession(), getMemberByToken(token), getAdmin()]);
  const allowed = Boolean(admin?.can("members.pii")) || (session?.role === "member" && member?.memberNumber === session.memberNumber);
  if (!member || !member.photo || !allowed) return new Response("Introuvable.", { status: 404 });
  const file = await readPhoto(member.id);
  if (!file) return new Response("Fichier introuvable.", { status: 404 });
  return new Response(new Uint8Array(file.bytes), {
    headers: { "Content-Type": file.mime, "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" },
  });
}
