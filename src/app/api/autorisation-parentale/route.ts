import { buildAuthorizationTemplate } from "@/lib/server/pdf";

/** Modèle d'autorisation parentale à imprimer et signer. */
export async function GET() {
  const bytes = await buildAuthorizationTemplate();
  return new Response(Buffer.from(bytes), {
    headers: { "Content-Type": "application/pdf", "Content-Disposition": 'inline; filename="autorisation-parentale-dames-du-parc.pdf"', "Cache-Control": "public, max-age=3600" },
  });
}
