import { json } from "@/lib/server/http";
import { sqlEnabled, sqlStats } from "@/lib/server/sql";

/** Contrôle de disponibilité (supervision) : indique seulement si le site et sa base répondent, sans aucun détail interne. */
export async function GET() {
  if (!sqlEnabled()) return json({ ok: true, storage: "files" });
  try {
    await sqlStats();
    return json({ ok: true, storage: "database" });
  } catch {
    return json({ ok: false }, 503);
  }
}
