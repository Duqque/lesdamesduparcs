import { getEvent } from "@/lib/server/events";
import { json, throttled, readJson } from "@/lib/server/http";
import { eventUnitPrice } from "@/lib/server/pricing";
import { getSession } from "@/lib/server/session";
import { checkPromo } from "@/lib/server/shop";

/** Vérifie un code promotionnel pour une inscription (le prix vient de l'événement, jamais du navigateur). */
export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  if (await throttled(req, "promo-event", 30)) return json({ error: "Trop de tentatives." }, 429);
  const { slug } = await params;
  const event = await getEvent(slug);
  const session = await getSession();
  const body = await readJson<{ code?: string; places?: number }>(req);
  if (!event || !body?.code) return json({ error: "Requête invalide." }, 400);
  const places = event.registration.singlePlace ? 1 : Math.min(Math.max(Number(body.places) || 1, 1), 4);
  const { unitCents } = await eventUnitPrice(event, session?.role === "member" ? session.memberNumber : undefined);
  const r = await checkPromo(body.code, "event", unitCents * places);
  if (!r || !r.ok) return json({ error: r && !r.ok ? r.error : "Code invalide." }, 422);
  return json({ discountCents: r.discountCents, label: r.promo.label || r.promo.code });
}
