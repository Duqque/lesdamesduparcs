import { json, throttled } from "@/lib/server/http";
import { paymentConfigured } from "@/lib/server/helloasso";
import { startShopPayment } from "@/lib/server/checkout";
import { logEvent } from "@/lib/server/log";
import { reconcile } from "@/lib/server/payments";
import { getSession, safeEqual } from "@/lib/server/session";
import { getOrder, updateOrder } from "@/lib/server/store";

/**
 * POST /api/orders/{id}/retry {t} : nouvel essai de paiement pour la MÊME commande (aucune nouvelle commande, le panier n'est pas recomposé).
 * Une intention de paiement HelloAsso n'est valable que 15 minutes : on en crée simplement une nouvelle. Avant cela, l'ancienne est relue :
 * si elle a en réalité été payée, la commande est validée et aucun second paiement n'est proposé.
 */
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (await throttled(req, "order-retry", 10, 600_000)) return json({ error: "Trop de tentatives. Réessayez dans quelques minutes." }, 429);
  const body = (await req.json().catch(() => null)) as { t?: string } | null;
  const order = await getOrder(id);
  const session = await getSession();
  if (!order || !(safeEqual(order.token, body?.t ?? "") || (session?.role === "member" && order.memberNumber === session.memberNumber))) return json({ error: "Commande introuvable." }, 404);
  if (order.status === "paid") return json({ error: "Cette commande est déjà payée.", status: "PAID" }, 409);
  if (order.status !== "awaiting_payment" && order.status !== "failed") return json({ error: "Cette commande ne peut plus être réglée." }, 409);
  if (!paymentConfigured()) return json({ error: "Le paiement en ligne n'est pas disponible pour le moment." }, 503);
  try {
    if (order.checkoutId && (await reconcile("order", order.id)) === "paid") return json({ error: "Cette commande est déjà payée.", status: "PAID" }, 409);
  } catch {
    /* on propose tout de même un nouvel essai */
  }
  try {
    const checkout = await startShopPayment(req, order);
    await updateOrder(order.id, { checkoutId: checkout.id, status: "awaiting_payment", attempts: (order.attempts ?? 1) + 1 });
    logEvent("checkout_retry", { orderId: order.id, orderNumber: order.orderNumber, attempt: (order.attempts ?? 1) + 1, checkoutIntentId: checkout.id });
    return json({ ok: true, checkoutUrl: checkout.url });
  } catch (e) {
    logEvent("checkout_failed", { orderId: order.id, orderNumber: order.orderNumber, error: e instanceof Error ? e.message : "erreur" }, "error");
    return json({ error: "Le paiement en ligne est momentanément indisponible. Réessayez dans quelques instants." }, 502);
  }
}
