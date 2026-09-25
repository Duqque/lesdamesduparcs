import Image from "next/image";
import Link from "next/link";
import { formatPrice } from "@/lib/money";
import { cn } from "@/lib/cn";
import type { ShopProduct } from "@/data/shop";
import { QuickAdd } from "./QuickAdd";

export function Price({ product, className }: { product: ShopProduct; className?: string }) {
  return (
    <p className={cn("flex items-baseline gap-2.5 font-display text-[22px] font-semibold tabular-nums tracking-[0.02em] text-white", className)}>
      {formatPrice(product.priceCents)}
      {product.compareAtCents && <span className="font-body text-[14px] font-normal text-mist line-through">{formatPrice(product.compareAtCents)}</span>}
    </p>
  );
}

/** Carte produit : visuel arrondi, pastille « Nouveau », nom en capitales condensées, prix barré, ajout rapide. */
export function ProductCard({ product, priority = false }: { product: ShopProduct; priority?: boolean }) {
  return (
    <article className="group relative">
      <Link href={`/boutique/${product.id}`} data-cursor="view" className="block">
        <div className="relative aspect-[3/4] overflow-hidden rounded-[22px] bg-[#e9ebee]">
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            priority={priority}
            sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 100vw"
            className="object-cover object-top transition-transform duration-[1200ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04]"
          />
          {product.isNew && <span className="absolute left-4 top-4 rounded-full bg-night-950 px-3.5 py-1.5 font-display text-[12px] font-semibold uppercase tracking-[0.12em] text-white">Nouveau</span>}
        </div>
        <h3 className="mt-5 font-display text-[clamp(22px,2.2vw,28px)] font-semibold uppercase leading-none tracking-[0.04em] text-white">{product.name}</h3>
        <p className="mt-2.5 line-clamp-2 font-body text-[13.5px] leading-[1.7] text-mist">{product.tagline}. {product.description}</p>
      </Link>
      <div className="mt-4 flex items-center justify-between gap-4">
        <Price product={product} />
        <QuickAdd product={product} />
      </div>
    </article>
  );
}
