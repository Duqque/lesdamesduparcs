import { readMedia } from "@/lib/server/media";

/** Fichiers de la médiathèque, servis publiquement (les images des pages et articles). */
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!/^[a-f0-9]{16}$/.test(id)) return new Response("Introuvable", { status: 404 });
  const found = await readMedia(id);
  if (!found) return new Response("Introuvable", { status: 404 });
  const headers: Record<string, string> = { "Content-Type": found.media.mime, "Cache-Control": "public, max-age=86400", "X-Content-Type-Options": "nosniff" };
  if (found.media.mime === "image/svg+xml") headers["Content-Security-Policy"] = "default-src 'none'; style-src 'unsafe-inline'; sandbox";
  return new Response(new Uint8Array(found.bytes), { headers });
}
