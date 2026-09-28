import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductGallery } from "@/components/shop/ProductGallery";
import { ArrowLeft, RotateCcw, Truck } from "lucide-react";
import { Price, ProductCard } from "@/components/shop/ProductCard";
import { ProductActions } from "@/components/shop/ProductActions";
import { getPublicCatalog, getProductPublic } from "@/lib/server/shop";
import { isSoldOut } from "@/lib/shop";
import { formatPrice } from "@/lib/money";

export async function generateStaticParams() {
  return (await getPublicCatalog()).products.map((p) => ({ slug: p.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = await getProductPublic(slug);
  return p ? { title: p.name, description: p.description, openGraph: { title: p.name, description: p.description, images: [p.images[0]] } } : {};
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [product, catalog] = await Promise.all([getProductPublic(slug), getPublicCatalog()]);
  if (!product) notFound();
  const shipping = catalog.rules;
  const related = catalog.products.filter((p) => p.id !== product.id).slice(0, 4);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.images,
    offers: { "@type": "Offer", priceCurrency: "EUR", price: (product.priceCents / 100).toFixed(2), availability: isSoldOut(product) ? "https://schema.org/OutOfStock" : "https://schema.org/InStock" },
  };

  return (
    <main className="mx-auto max-w-[1300px] px-[var(--gutter)] pb-40 pt-[170px] md:pt-[220px]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <Link href="/boutique" className="group inline-flex min-h-11 items-center gap-2 font-body text-[13px] font-medium text-white/75 hover:text-white">
        <ArrowLeft aria-hidden className="size-4 transition-transform duration-300 group-hover:-translate-x-1" /> La boutique
      </Link>

      <div className="mt-8 grid gap-12 lg:grid-cols-[1.1fr_1fr] lg:gap-20">
        <ProductGallery name={product.name} images={product.images} videos={product.videos} isNew={product.isNew} />

        <div className="lg:pt-6">
          <p className="t-eyebrow">{product.category}</p>
          <h1 className="mt-4 t-h1">{product.name}</h1>
          <Price product={product} className="mt-5 text-[30px] sm:text-[30px]" />
          <p className="mt-2 font-body text-[12.5px] text-mist">TTC, hors frais de livraison</p>
          <p className="mt-8 text-white/80 t-lead">{product.description}</p>

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
        <h2 id="related" className="t-h2">Vous aimerez aussi</h2>
        <ul className="mt-12 grid grid-cols-2 gap-x-3.5 gap-y-10 sm:gap-x-8 sm:gap-y-16 lg:grid-cols-3">
          {related.map((p, i) => (
            <li key={p.id} className={i === 3 ? "lg:hidden" : undefined}>
              <ProductCard product={p} />
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
