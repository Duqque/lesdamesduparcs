import { membershipState } from "@/lib/server/business";
import { json, throttled, readJson } from "@/lib/server/http";
import { getSession } from "@/lib/server/session";
import { checkPromo, productsDb } from "@/lib/server/shop";
import { getMemberByNumber } from "@/lib/server/store";

/** Vérifie un code promotionnel sur le contenu du panier (les prix viennent du catalogue, jamais du navigateur). */
export async function POST(req: Request) {
  if (await throttled(req, "promo", 30)) return json({ error: "Trop de tentatives." }, 429);
  const body = await readJson<{ code?: string; items?: Array<{ productId: string; qty: number }>; email?: string }>(req);
  if (!body?.code || !Array.isArray(body.items)) return json({ error: "Requête invalide." }, 400);
  const rows = await productsDb.all();
  const lines = body.items.flatMap((i) => {
    const p = rows.find((x) => x.id === i.productId && x.status === "active");
    return p ? [{ productId: p.id, category: p.category, totalCents: p.priceCents * Math.min(Math.max(Number(i.qty) || 0, 0), 10) }] : [];
  });
  const session = await getSession();
  const stored = session?.role === "member" ? await getMemberByNumber(session.memberNumber) : null;
  const r = await checkPromo(body.code, "shop", {
    subtotalCents: lines.reduce((n, l) => n + l.totalCents, 0),
    lines,
    member: stored ? { memberNumber: stored.memberNumber, state: await membershipState(stored.id), joinedAt: stored.joinedAt } : null,
    email: typeof body.email === "string" ? body.email : stored?.email,
  });
  if (!r || !r.ok) return json({ error: r && !r.ok ? r.error : "Code invalide." }, 422);
  return json({ discountCents: r.discountCents, label: r.promo.label || r.promo.code });
}
