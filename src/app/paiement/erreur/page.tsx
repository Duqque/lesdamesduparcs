import type { Metadata } from "next";
import { Suspense } from "react";
import { markOrderFailed, reconcile } from "@/lib/server/payments";
import { safeEqual } from "@/lib/server/session";
import { getOrder } from "@/lib/server/store";
import { PaymentStatusClient } from "../PaymentStatusClient";

export const metadata: Metadata = { title: "Paiement non abouti", robots: { index: false } };

/** Retour d'erreur de HelloAsso : le paiement est relu ; s'il n'est pas réglé, la commande passe à « échouée » (nouvel essai possible). */
export default async function PaymentErrorPage({ searchParams }: { searchParams: Promise<{ order?: string; t?: string }> }) {
  const { order: id = "", t = "" } = await searchParams;
  const order = id ? await getOrder(id) : null;
  if (order && safeEqual(order.token, t) && order.status === "awaiting_payment") {
    try {
      if (order.checkoutId && (await reconcile("order", order.id)) === "paid") {
        /* payé malgré le retour d'erreur : la commande est validée */
      } else if ((await getOrder(id))?.status === "awaiting_payment") await markOrderFailed(order, "retour en erreur");
    } catch {
      await markOrderFailed(order, "retour en erreur");
    }
  }
  return (
    <Suspense fallback={null}>
      <PaymentStatusClient mode="erreur" />
    </Suspense>
  );
}
