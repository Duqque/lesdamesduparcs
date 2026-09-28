import Image from "next/image";
import Link from "next/link";
import { formatPrice } from "@/lib/money";
import { cn } from "@/lib/cn";
import { isSoldOut, type ShopProduct } from "@/lib/shop";
import { QuickAdd } from "./QuickAdd";

export function Price({ product, className }: { product: ShopProduct; className?: string }) {
  return (
    <p className={cn("flex flex-wrap items-baseline gap-x-2 font-display text-[16px] font-semibold tabular-nums sm:text-[22px] tracking-[0.02em] text-white", className)}>
      {formatPrice(product.priceCents)}
      {product.compareAtCents && <span className="font-body text-[12px] font-normal text-mist line-through sm:text-[14px]">{formatPrice(product.compareAtCents)}</span>}
    </p>
  );
}

/** Carte produit : visuel arrondi, pastille « Nouveau », nom en capitales condensées, prix barré, ajout rapide. */
export function ProductCard({ product, priority = false }: { product: ShopProduct; priority?: boolean }) {
  return (
    <article className="group relative flex h-full flex-col">
      <Link href={`/boutique/${product.id}`} data-cursor="view" className="block flex-1">
        <div className="relative aspect-[3/4] overflow-hidden rounded-[14px] bg-[#e9ebee] sm:rounded-[22px]">
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            priority={priority}
            sizes="(min-width: 1024px) 30vw, 50vw"
            className="object-cover object-top transition-transform duration-[1200ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04]"
          />
          {isSoldOut(product) && <span className="absolute right-2 top-2 rounded-full bg-white px-2.5 py-1 font-display text-[10px] sm:right-4 sm:top-4 sm:px-3.5 sm:py-1.5 sm:text-[12px] font-semibold uppercase tracking-[0.12em] text-night-950">Épuisé</span>}
          {product.isNew && <span className="absolute left-2 top-2 rounded-full bg-night-950 px-2.5 py-1 font-display text-[10px] sm:left-4 sm:top-4 sm:px-3.5 sm:py-1.5 sm:text-[12px] font-semibold uppercase tracking-[0.12em] text-white">Nouveau</span>}
        </div>
        <h3 className="mt-3 t-h3 sm:mt-5">{product.name}</h3>
        <p className="mt-1.5 line-clamp-2 text-mist t-caption sm:mt-2.5 sm:t-small">{product.tagline}. {product.description}</p>
      </Link>
      <div className="mt-3 flex items-end justify-between gap-2 sm:mt-4 sm:items-center sm:gap-4">
        <Price product={product} />
        <QuickAdd product={product} />
      </div>
    </article>
  );
}
