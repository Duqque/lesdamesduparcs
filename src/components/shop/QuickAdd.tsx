"use client";

import { useRouter } from "next/navigation";
import { Plus, ShoppingBag } from "lucide-react";
import { addToCart } from "@/lib/cart";
import { isSoldOut, type ShopProduct } from "@/lib/shop";

/** Ajout rapide : direct pour un article sans taille, sinon vers la fiche pour choisir la taille. Désactivé si épuisé. */
export function QuickAdd({ product }: { product: ShopProduct }) {
  const router = useRouter();
  if (isSoldOut(product)) return <span className="font-body text-[12.5px] font-medium uppercase tracking-[0.14em] text-mist">Épuisé</span>;
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
