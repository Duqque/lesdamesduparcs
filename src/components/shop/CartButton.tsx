"use client";

import { ShoppingBag } from "lucide-react";
import { computeTotals, setDrawer, useCartLines } from "@/lib/cart";
import { cn } from "@/lib/cn";
import { useShop } from "./ShopProvider";

export function CartButton({ className }: { className?: string }) {
  const shop = useShop();
  const count = computeTotals(useCartLines(), shop).count;
  return (
    <button type="button" onClick={() => setDrawer(true)} aria-label={`Panier, ${count} article${count > 1 ? "s" : ""}`} className={cn(className)}>
      <ShoppingBag aria-hidden className="size-[19px]" strokeWidth={1.7} />
      {count > 0 && (
        <span aria-hidden className="absolute -right-1.5 -top-1.5 grid min-w-[19px] place-items-center rounded-full bg-psg-red px-1 font-body text-[10.5px] font-semibold leading-[19px] text-white">
          {count}
        </span>
      )}
    </button>
  );
}
