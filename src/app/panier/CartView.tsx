"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { CartLines } from "@/components/shop/CartLines";
import { Button } from "@/components/ui/Button";
import { shipping } from "@/data/shop";
import { computeTotals, useCartLines } from "@/lib/cart";
import { formatPrice } from "@/lib/money";

export function CartView() {
  const lines = useCartLines();
  const totals = computeTotals(lines);
  const ship = totals.shippingCents("home");
  return (
    <main className="mx-auto max-w-[1100px] px-[var(--gutter)] pb-40 pt-[190px] md:pt-[240px]">
      <h1 className="t-h1">Panier</h1>

      {lines.length === 0 ? (
        <div className="mt-16 flex flex-col items-start gap-6">
          <ShoppingBag aria-hidden className="size-12 text-white/30" strokeWidth={1.1} />
          <p className="font-body text-[16px] text-mist">Votre panier est vide.</p>
          <Button href="/boutique" size="lg">Découvrir la boutique</Button>
        </div>
      ) : (
        <div className="mt-14 grid gap-14 lg:grid-cols-[1fr_360px] lg:gap-20">
          <CartLines lines={lines} />
          <aside aria-label="Récapitulatif" className="h-fit rounded-[16px] border border-white/10 bg-[#0b1327]/90 p-7 lg:sticky lg:top-[120px]">
            <dl className="space-y-3 font-body text-[14.5px]">
              <div className="flex justify-between text-mist">
                <dt>Sous-total ({totals.count} article{totals.count > 1 ? "s" : ""})</dt>
                <dd className="tabular-nums text-white">{formatPrice(totals.subtotalCents)}</dd>
              </div>
              <div className="flex justify-between text-mist">
                <dt>Livraison</dt>
                <dd className="tabular-nums text-white">{ship === 0 ? "Offerte" : formatPrice(ship)}</dd>
              </div>
              <div className="flex justify-between border-t border-white/10 pt-4 text-[17px] font-medium text-white">
                <dt>Total TTC</dt>
                <dd className="tabular-nums">{formatPrice(totals.subtotalCents + ship)}</dd>
              </div>
            </dl>
            <p className="mt-4 font-body text-[12.5px] leading-relaxed text-mist">Livraison offerte dès {formatPrice(shipping.freeFromCents)}, ou retrait gratuit lors d&rsquo;un événement du groupe.</p>
            <div className="mt-6 flex flex-col gap-3">
              <Button href="/commande" size="lg" arrow={false} className="w-full">Commander</Button>
              <Link href="/boutique" className="text-center font-body text-[13.5px] text-white/80 underline decoration-white/25 underline-offset-4 hover:decoration-white">Continuer mes achats</Link>
            </div>
          </aside>
        </div>
      )}
    </main>
  );
}
