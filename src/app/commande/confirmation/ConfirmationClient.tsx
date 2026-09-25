"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { CheckCircle2, Clock } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { clearCart } from "@/lib/cart";
import { formatPrice } from "@/lib/money";
import type { Order } from "@/lib/orders";

export function ConfirmationClient() {
  const params = useSearchParams();
  const id = params.get("order") ?? "";
  const token = params.get("t") ?? "";
  const etat = params.get("etat") ?? "";
  const [order, setOrder] = useState<Omit<Order, "token" | "stripeSessionId"> | null | undefined>(undefined);

  useEffect(() => {
    if (etat === "paye") clearCart();
    let cancelled = false;
    fetch(`/api/shop/order?id=${encodeURIComponent(id)}&t=${encodeURIComponent(token)}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((o) => !cancelled && setOrder(o))
      .catch(() => !cancelled && setOrder(null));
    return () => {
      cancelled = true;
    };
  }, [id, token, etat]);

  const paid = order?.status === "paid";
  return (
    <main className="mx-auto max-w-[760px] px-[var(--gutter)] pb-40 pt-[200px] md:pt-[250px]">
      {order === undefined && <p className="font-body text-mist">Chargement de votre commande…</p>}
      {order === null && (
        <>
          <h1 className="font-display text-[clamp(36px,4.6vw,60px)] font-semibold uppercase leading-none tracking-[0.05em] text-white">Commande introuvable</h1>
          <p className="mt-6 font-body text-[15.5px] text-mist">Le lien est invalide ou a expiré.</p>
          <div className="mt-8"><Button href="/boutique" size="lg">Retour à la boutique</Button></div>
        </>
      )}
      {order && (
        <>
          <p className="flex items-center gap-3 font-body text-[13px] font-semibold uppercase tracking-[0.25em] text-psg-red-bright">
            {paid ? <CheckCircle2 aria-hidden className="size-5" /> : <Clock aria-hidden className="size-5" />}
            {paid ? "Paiement reçu" : "Commande enregistrée"}
          </p>
          <h1 className="mt-5 font-display text-[clamp(38px,5vw,66px)] font-semibold uppercase leading-none tracking-[0.05em] text-white">{paid ? "Merci pour votre commande" : "Presque terminé"}</h1>
          <p className="mt-6 font-body text-[15.5px] leading-[1.8] text-mist">
            {paid
              ? `Un récapitulatif sera envoyé à ${order.contact.email}. ${order.delivery.mode === "event" ? "Vous retirerez votre commande lors d'un prochain événement." : "Votre colis part sous 3 à 5 jours ouvrés."}`
              : "Votre commande est enregistrée mais le paiement n'est pas encore confirmé. Le paiement en ligne sera activé prochainement : nous vous contacterons pour le règlement."}
          </p>

          <div className="mt-12 rounded-[16px] border border-white/10 bg-[#0b1327]/90 p-7">
            <p className="font-body text-[12.5px] text-mist">Commande <span className="tabular-nums text-white/85">{order.id.slice(0, 8).toUpperCase()}</span></p>
            <ul className="mt-4 divide-y divide-white/10">
              {order.lines.map((l) => (
                <li key={`${l.productId}-${l.size ?? ""}`} className="flex justify-between gap-4 py-3 font-body text-[14.5px] text-white">
                  <span>{l.qty} × {l.name}{l.size ? ` (${l.size})` : ""}</span>
                  <span className="tabular-nums">{formatPrice(l.unitCents * l.qty)}</span>
                </li>
              ))}
            </ul>
            <dl className="mt-3 space-y-2 border-t border-white/10 pt-4 font-body text-[14px]">
              <div className="flex justify-between text-mist"><dt>Livraison</dt><dd className="tabular-nums text-white">{order.shippingCents === 0 ? "Offerte" : formatPrice(order.shippingCents)}</dd></div>
              <div className="flex justify-between text-[16px] font-medium text-white"><dt>Total TTC</dt><dd className="tabular-nums">{formatPrice(order.totalCents)}</dd></div>
            </dl>
            {order.delivery.address && (
              <p className="mt-5 border-t border-white/10 pt-5 font-body text-[13.5px] leading-[1.7] text-mist">
                Livraison : {order.contact.firstName} {order.contact.lastName}, {order.delivery.address.line1}, {order.delivery.address.postalCode} {order.delivery.address.city}
              </p>
            )}
          </div>
          <div className="mt-10"><Button href="/boutique" size="lg">Continuer mes achats</Button></div>
        </>
      )}
    </main>
  );
}
