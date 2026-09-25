"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useShop } from "./ShopProvider";
import { setQty, type CartLine } from "@/lib/cart";
import { formatPrice } from "@/lib/money";

export function CartLines({ lines, onNavigate, compact = false }: { lines: CartLine[]; onNavigate?: () => void; compact?: boolean }) {
  const { products } = useShop();
  return (
    <ul className="divide-y divide-white/10">
      {lines.map((l) => {
        const p = products.find((x) => x.id === l.productId);
        if (!p) return null;
        return (
          <li key={`${l.productId}-${l.size ?? ""}`} className="flex gap-4 py-5">
            <Link href={`/boutique/${p.id}`} onClick={onNavigate} className="relative block aspect-[3/4] w-[84px] shrink-0 overflow-hidden rounded-[10px] bg-[#e9ebee]">
              <Image src={p.images[0]} alt="" fill sizes="84px" className="object-cover object-top" />
            </Link>
            <div className="flex min-w-0 flex-1 flex-col">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <Link href={`/boutique/${p.id}`} onClick={onNavigate} className="block font-body text-[14.5px] font-medium leading-snug text-white hover:underline">
                    {p.name}
                  </Link>
                  {l.size && <p className="mt-1 font-body text-[12.5px] text-mist">Taille {l.size}</p>}
                </div>
                <p className="font-body text-[14.5px] tabular-nums text-white">{formatPrice(p.priceCents * l.qty)}</p>
              </div>
              <div className={`mt-auto flex items-center justify-between ${compact ? "pt-3" : "pt-4"}`}>
                <div className="flex h-10 items-center rounded-[8px] border border-white/15">
                  <button type="button" aria-label={`Diminuer la quantité de ${p.name}`} onClick={() => setQty(l, l.qty - 1)} className="grid size-10 place-items-center text-white/80 hover:text-white">
                    <Minus aria-hidden className="size-3.5" />
                  </button>
                  <span className="w-7 text-center font-body text-[14px] tabular-nums text-white">{l.qty}</span>
                  <button type="button" aria-label={`Augmenter la quantité de ${p.name}`} onClick={() => setQty(l, l.qty + 1)} className="grid size-10 place-items-center text-white/80 hover:text-white">
                    <Plus aria-hidden className="size-3.5" />
                  </button>
                </div>
                <button type="button" onClick={() => setQty(l, 0)} aria-label={`Retirer ${p.name}`} className="grid size-10 place-items-center text-mist hover:text-white">
                  <Trash2 aria-hidden className="size-[18px]" strokeWidth={1.6} />
                </button>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
