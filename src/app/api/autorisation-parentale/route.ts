import { buildAuthorizationTemplate } from "@/lib/server/pdf";
import { settings } from "@/lib/server/admin-store";

/** Modèle d'autorisation parentale à imprimer et signer. */
export async function GET() {
  const bytes = await buildAuthorizationTemplate((await settings.get()).association);
  return new Response(Buffer.from(bytes), {
    headers: { "Content-Type": "application/pdf", "Content-Disposition": 'inline; filename="autorisation-parentale-dames-du-parc.pdf"', "Cache-Control": "public, max-age=3600" },
  });
}
