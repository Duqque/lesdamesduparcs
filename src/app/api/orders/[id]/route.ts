import { getAdmin } from "@/lib/server/admin-auth";
import { json, throttled } from "@/lib/server/http";
import { paymentConfigured } from "@/lib/server/helloasso";
import { reconcile } from "@/lib/server/payments";
import { getSession, safeEqual } from "@/lib/server/session";
import { getOrder } from "@/lib/server/store";
import type { Order } from "@/lib/orders";

/** Statuts internes exposés sous leurs noms métier. */
export const PUBLIC_STATUS: Record<Order["status"], string> = {
  awaiting_payment: "PAYMENT_PENDING",
  paid: "PAID",
  cancelled: "CANCELLED",
  failed: "FAILED",
  refunded: "REFUNDED",
  partially_refunded: "PARTIALLY_REFUNDED",
};

/**
 * GET /api/orders/{id}?t=<jeton> : état d'une commande, pour la page « paiement en cours de confirmation ».
 * Accessible avec le jeton de la commande, à la propriétaire connectée ou à une administratrice. Le navigateur ne peut JAMAIS
 * déclarer une commande « payée » : tant que la notification HelloAsso n'est pas arrivée, l'état est relu chez HelloAsso (au plus
 * une fois toutes les quelques secondes) à partir de l'identifiant de paiement enregistré par le serveur.
 */
export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (await throttled(req, "order-status", 90, 60_000)) return json({ error: "Trop de requêtes." }, 429);
  let order = await getOrder(id);
  if (!order) return json({ error: "Commande introuvable." }, 404);
  const token = new URL(req.url).searchParams.get("t") ?? "";
  const [session, admin] = await Promise.all([getSession(), getAdmin()]);
  const allowed = safeEqual(order.token, token) || (session?.role === "member" && !!order.memberNumber && order.memberNumber === session.memberNumber) || Boolean(admin?.can("shop.orders"));
  if (!allowed) return json({ error: "Commande introuvable." }, 404);

  if ((order.status === "awaiting_payment" || order.status === "failed") && order.checkoutId && paymentConfigured()) {
    try {
      await reconcile("order", order.id);
      order = (await getOrder(id)) ?? order;
    } catch {
      /* HelloAsso injoignable : l'état reste celui enregistré */
    }
  }
  return json({
    id: order.id,
    orderNumber: order.orderNumber,
    status: PUBLIC_STATUS[order.status],
    paid: order.status === "paid",
    paidAt: order.paidAt,
    totalCents: order.totalCents,
    discountCents: order.discountCents ?? 0,
    promoCode: order.promoCode,
    hasMembership: Boolean(order.membership),
    lines: order.lines.map((l) => ({ name: l.name, size: l.size, qty: l.qty, unitCents: l.unitCents })),
    retryPossible: order.status === "awaiting_payment" || order.status === "failed",
  });
}
