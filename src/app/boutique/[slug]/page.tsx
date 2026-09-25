import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, RotateCcw, Truck } from "lucide-react";
import { Price, ProductCard } from "@/components/shop/ProductCard";
import { ProductActions } from "@/components/shop/ProductActions";
import { getProduct, products, shipping } from "@/data/shop";
import { formatPrice } from "@/lib/money";

export function generateStaticParams() {
  return products.map((p) => ({ slug: p.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = getProduct(slug);
  return p ? { title: p.name, description: p.description, openGraph: { title: p.name, description: p.description, images: [p.images[0]] } } : {};
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product) notFound();
  const related = products.filter((p) => p.id !== product.id).slice(0, 3);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.images,
    offers: { "@type": "Offer", priceCurrency: "EUR", price: (product.priceCents / 100).toFixed(2), availability: "https://schema.org/InStock" },
  };

  return (
    <main className="mx-auto max-w-[1300px] px-[var(--gutter)] pb-40 pt-[170px] md:pt-[220px]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Link href="/boutique" className="group inline-flex min-h-11 items-center gap-2 font-body text-[13px] font-medium text-white/75 hover:text-white">
        <ArrowLeft aria-hidden className="size-4 transition-transform duration-300 group-hover:-translate-x-1" /> La boutique
      </Link>

      <div className="mt-8 grid gap-12 lg:grid-cols-[1.1fr_1fr] lg:gap-20">
        <div className="grid gap-4 sm:grid-cols-[1fr_88px] sm:grid-flow-dense">
          <div className="relative aspect-[3/4] overflow-hidden rounded-[22px] bg-[#e9ebee] sm:col-start-1">
            <Image src={product.images[0]} alt={product.name} fill priority sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover object-top" />
            {product.isNew && <span className="absolute left-4 top-4 rounded-full bg-night-950 px-3.5 py-1.5 font-display text-[12px] font-semibold uppercase tracking-[0.12em] text-white">Nouveau</span>}
          </div>
          <div className="flex gap-3 sm:col-start-2 sm:flex-col">
            {product.images.map((src, i) => (
              <div key={src} className="relative aspect-[3/4] w-20 overflow-hidden rounded-[10px] bg-[#e9ebee] ring-1 ring-white/20 sm:w-full">
                <Image src={src} alt={`${product.name}, vue ${i + 1}`} fill sizes="88px" className="object-cover object-top" />
              </div>
            ))}
          </div>
        </div>

        <div className="lg:pt-6">
          <p className="font-body text-[12px] font-semibold uppercase tracking-[0.3em] text-psg-red-bright">{product.category}</p>
          <h1 className="mt-4 font-display text-[clamp(34px,4.4vw,60px)] font-semibold uppercase leading-[0.98] tracking-[0.04em] text-white">{product.name}</h1>
          <Price product={product} className="mt-5 text-[30px]" />
          <p className="mt-2 font-body text-[12.5px] text-mist">TTC, hors frais de livraison</p>
          <p className="mt-8 font-body text-[15.5px] leading-[1.85] text-white/80">{product.description}</p>

          <div className="mt-10">
            <ProductActions product={product} />
          </div>

          <ul className="mt-12 space-y-3 border-t border-white/10 pt-8 font-body text-[14px] text-mist">
            {product.details.map((d) => (
              <li key={d} className="flex items-center gap-3">
                <span aria-hidden className="size-1 rounded-full bg-psg-red-bright" /> {d}
              </li>
            ))}
          </ul>

          <div className="mt-10 grid gap-5 rounded-[14px] border border-white/10 p-6 font-body text-[13.5px] leading-[1.7] text-mist">
            <p className="flex gap-3">
              <Truck aria-hidden className="mt-0.5 size-5 shrink-0 text-white/70" strokeWidth={1.5} />
              <span>Livraison standard {formatPrice(shipping.standardCents)}, offerte dès {formatPrice(shipping.freeFromCents)}. Retrait gratuit lors d&rsquo;un événement du groupe.</span>
            </p>
            <p className="flex gap-3">
              <RotateCcw aria-hidden className="mt-0.5 size-5 shrink-0 text-white/70" strokeWidth={1.5} />
              <span>Retour possible sous 14 jours, article non porté et dans son emballage.</span>
            </p>
          </div>
        </div>
      </div>

      <section aria-labelledby="related" className="pt-32 md:pt-44">
        <h2 id="related" className="font-display text-[clamp(28px,3.6vw,48px)] font-semibold uppercase tracking-[0.05em] text-white">Vous aimerez aussi</h2>
        <ul className="mt-12 grid gap-x-8 gap-y-16 sm:grid-cols-2 lg:grid-cols-3">
          {related.map((p) => (
            <li key={p.id}>
              <ProductCard product={p} />
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
