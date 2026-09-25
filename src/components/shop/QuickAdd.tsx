"use client";

import { useRouter } from "next/navigation";
import { Plus, ShoppingBag } from "lucide-react";
import { addToCart } from "@/lib/cart";
import type { ShopProduct } from "@/data/shop";

/** Ajout rapide : direct pour un article sans taille, sinon vers la fiche pour choisir la taille. */
export function QuickAdd({ product }: { product: ShopProduct }) {
  const router = useRouter();
  return (
    <button
      type="button"
      aria-label={product.sizes ? `Choisir la taille de ${product.name}` : `Ajouter ${product.name} au panier`}
      onClick={() => (product.sizes ? router.push(`/boutique/${product.id}`) : addToCart({ productId: product.id, qty: 1 }))}
      className="grid size-11 shrink-0 place-items-center rounded-full border border-white/20 text-white transition-colors hover:border-white hover:bg-white hover:text-night-950"
    >
      {product.sizes ? <Plus aria-hidden className="size-5" strokeWidth={1.7} /> : <ShoppingBag aria-hidden className="size-[18px]" strokeWidth={1.7} />}
    </button>
  );
}
