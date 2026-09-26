import { NextResponse } from "next/server";
import { safeEqual } from "@/lib/server/session";
import { siteUrl } from "@/lib/server/http";
import { getOrder } from "@/lib/server/store";
import { reconcile } from "@/lib/server/payments";
import { paymentConfigured } from "@/lib/server/helloasso";

/** Retour de la page de paiement : le paiement est relu chez HelloAsso (identifiant enregistré pour cette commande) avant de marquer la commande « payée ». */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const id = url.searchParams.get("order") ?? "";
  const token = url.searchParams.get("t") ?? "";
  const go = (state: string) => NextResponse.redirect(`${siteUrl(req)}/commande/confirmation?order=${encodeURIComponent(id)}&t=${encodeURIComponent(token)}&etat=${state}`);

  const order = await getOrder(id);
  if (!order || !safeEqual(order.token, token) || !paymentConfigured() || !order.checkoutId) return go("erreur");
  if (url.searchParams.get("code") === "error") return go("attente");
  try {
    const result = await reconcile("order", order.id);
    if (result === "paid" || result === "already") return go("paye");
    if (result === "unpaid") return go("attente");
  } catch {
    /* HelloAsso injoignable : la commande reste en attente, la notification ou le rattrapage la confirmera */
  }
  return go("erreur");
}
