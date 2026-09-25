import { NextResponse } from "next/server";
import { safeEqual } from "@/lib/server/session";
import { siteUrl } from "@/lib/server/http";
import { getOrder, updateOrder } from "@/lib/server/store";
import { retrieveCheckoutSession, stripeConfigured } from "@/lib/server/stripe";

/** Retour de Stripe Checkout : le paiement est vérifié auprès de Stripe avant de marquer la commande « payée ». */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const id = url.searchParams.get("order") ?? "";
  const token = url.searchParams.get("t") ?? "";
  const sessionId = url.searchParams.get("session_id") ?? "";
  const go = (state: string) => NextResponse.redirect(`${siteUrl(req)}/commande/confirmation?order=${id}&t=${token}&etat=${state}`);

  const order = await getOrder(id);
  if (!order || !safeEqual(order.token, token) || !stripeConfigured() || order.stripeSessionId !== sessionId) return go("erreur");
  try {
    const checkout = await retrieveCheckoutSession(sessionId);
    if (checkout.payment_status === "paid" && checkout.metadata?.order === order.id) {
      await updateOrder(order.id, { status: "paid" });
      return go("paye");
    }
  } catch {
    return go("erreur");
  }
  return go("attente");
}
