import { safeEqual } from "@/lib/server/session";
import { json } from "@/lib/server/http";
import { getOrder } from "@/lib/server/store";

/** Consultation d'une commande : identifiant + jeton secret (fournis à l'acheteur). */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const order = await getOrder(url.searchParams.get("id") ?? "");
  if (!order || !safeEqual(order.token, url.searchParams.get("t") ?? "")) return json({ error: "Commande introuvable." }, 404);
  const { token: _t, stripeSessionId: _s, ...safe } = order;
  void _t;
  void _s;
  return json(safe);
}
