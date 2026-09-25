"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Minus, Plus, ShoppingBag, Zap } from "lucide-react";
import { addToCart } from "@/lib/cart";
import { cn } from "@/lib/cn";
import { availableQty, isSoldOut, type ShopProduct } from "@/lib/shop";

/** Choix de la taille et de la quantité, ajout au panier ou achat rapide (direct vers la commande). */
export function ProductActions({ product }: { product: ShopProduct }) {
  const router = useRouter();
  const [size, setSize] = useState<string | undefined>();
  const [qty, setQty] = useState(1);
  const [error, setError] = useState("");

  if (isSoldOut(product)) {
    return <p className="rounded-[10px] border border-white/15 bg-white/[0.04] px-5 py-4 font-body text-[14.5px] text-white/85">Cet article est actuellement épuisé.</p>;
  }
  const maxQty = Math.min(10, availableQty(product, size));

  const line = () => {
    if (product.sizes && !size) {
      setError("Choisissez une taille.");
      return null;
    }
    setError("");
    return { productId: product.id, size, qty };
  };

  return (
    <div>
      {product.sizes && (
        <fieldset>
          <legend className="font-body text-[13px] font-medium text-white/85">Taille</legend>
          <div className="mt-3 flex flex-wrap gap-2">
            {product.sizes.map((s) => (
              <button key={s} type="button" disabled={availableQty(product, s) <= 0} aria-pressed={size === s} onClick={() => { setSize(s); setQty((q) => Math.min(q, Math.max(availableQty(product, s), 1))); setError(""); }} className={cn("grid h-12 min-w-14 place-items-center rounded-[10px] border px-4 font-body text-[14px] font-medium transition-colors disabled:cursor-not-allowed disabled:text-white/30 disabled:line-through", size === s ? "border-white bg-white text-night-950" : "border-white/15 text-white/85 hover:border-white/50")}>
                {s}
              </button>
            ))}
          </div>
          {error && <p role="alert" className="mt-2 font-body text-[13px] text-[#ff8b9b]">{error}</p>}
        </fieldset>
      )}

      <div className="mt-7 flex items-center gap-3">
        <div className="flex h-[54px] items-center rounded-[10px] border border-white/15">
          <button type="button" aria-label="Diminuer la quantité" onClick={() => setQty((q) => Math.max(1, q - 1))} className="grid size-[52px] place-items-center text-white/80 hover:text-white">
            <Minus aria-hidden className="size-4" />
          </button>
          <span aria-live="polite" className="w-8 text-center font-body text-[15px] tabular-nums text-white">{qty}</span>
          <button type="button" aria-label="Augmenter la quantité" onClick={() => setQty((q) => Math.min(maxQty, q + 1))} className="grid size-[52px] place-items-center text-white/80 hover:text-white">
            <Plus aria-hidden className="size-4" />
          </button>
        </div>
        <button
          type="button"
          onClick={() => {
            const l = line();
            if (l) addToCart(l);
          }}
          className="inline-flex h-[54px] flex-1 items-center justify-center gap-3 rounded-[10px] border border-[#ff6b80]/45 bg-[linear-gradient(180deg,#e51b36_0%,#b30d27_100%)] font-body text-[15.5px] font-medium text-white transition-[filter,transform] hover:-translate-y-0.5 hover:brightness-110"
        >
          <ShoppingBag aria-hidden className="size-5" strokeWidth={1.7} /> Ajouter au panier
        </button>
      </div>

      <button
        type="button"
        onClick={() => {
          const l = line();
          if (!l) return;
          addToCart(l, false);
          router.push("/commande");
        }}
        className="mt-3 inline-flex h-[54px] w-full items-center justify-center gap-3 rounded-[10px] border border-white/[0.14] bg-[#121417]/90 font-body text-[15.5px] font-medium text-white transition-colors hover:border-white/35 hover:bg-[#1b1e23]"
      >
        <Zap aria-hidden className="size-5" strokeWidth={1.7} /> Achat rapide
      </button>
      {Number.isFinite(maxQty) && maxQty <= 5 && <p className="mt-3 text-center font-body text-[12.5px] text-[#ffb3be]">Plus que {maxQty} en stock.</p>}
      <p className="mt-3 text-center font-body text-[12.5px] text-mist">Sans compte, en moins d&rsquo;une minute.</p>
    </div>
  );
}
