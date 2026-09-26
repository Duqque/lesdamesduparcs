import { json, throttled, readJson } from "@/lib/server/http";
import { pageViews } from "@/lib/server/content";

/** Mesure d'audience interne : aucune adresse IP ni cookie n'est enregistré, seulement la page, la provenance et un identifiant de session anonyme. */
export async function POST(req: Request) {
  if (await throttled(req, "track", 120, 600_000)) return json({ ok: true });
  const body = await readJson<{ path?: string; ref?: string; sid?: string }>(req);
  const path = body?.path?.slice(0, 200) ?? "";
  if (!path.startsWith("/") || path.startsWith("/admin") || path.startsWith("/api")) return json({ ok: true });
  await pageViews.insert({ path, ref: (body?.ref ?? "").slice(0, 120), sid: String(body?.sid ?? "").slice(0, 40) });
  return json({ ok: true });
}
