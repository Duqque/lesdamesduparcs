import { json, throttled } from "@/lib/server/http";
import { checkPromo, productsDb } from "@/lib/server/shop";

/** Vérifie un code promotionnel sur le contenu du panier (les prix viennent du catalogue, jamais du navigateur). */
export async function POST(req: Request) {
  if (throttled(req, "promo", 30)) return json({ error: "Trop de tentatives." }, 429);
  const body = (await req.json().catch(() => null)) as { code?: string; items?: Array<{ productId: string; qty: number }> } | null;
  if (!body?.code || !Array.isArray(body.items)) return json({ error: "Requête invalide." }, 400);
  const rows = await productsDb.all();
  const subtotal = body.items.reduce((n, i) => n + (rows.find((p) => p.id === i.productId && p.status === "active")?.priceCents ?? 0) * Math.min(Math.max(Number(i.qty) || 0, 0), 10), 0);
  const r = await checkPromo(body.code, "shop", subtotal);
  if (!r || !r.ok) return json({ error: r && !r.ok ? r.error : "Code invalide." }, 422);
  return json({ discountCents: r.discountCents, label: r.promo.label || r.promo.code });
}
