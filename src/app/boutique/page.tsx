import type { Metadata } from "next";
import { seoFor } from "@/lib/server/site";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Catalog } from "@/components/shop/Catalog";
import { ProductCard } from "@/components/shop/ProductCard";
import { ShopHero } from "@/components/shop/ShopHero";
import { Reveal } from "@/components/ui/Reveal";
import { getPublicCatalog } from "@/lib/server/shop";
import { JoinGate, JoinSectionGate } from "@/components/member/JoinGate";

export async function generateMetadata(): Promise<Metadata> {
  return seoFor("/boutique", { title: "Boutique", description: "La boutique des Dames du Parc : écharpes, sweats, t-shirts et accessoires aux couleurs de Paris. Achat rapide, sans compte." });
}

const label = "t-eyebrow";
const h2 = "mt-4 t-h2";

export default async function ShopPage() {
  const { products } = await getPublicCatalog();
  const fresh = products.filter((p) => p.isNew).slice(0, 3);
  return (
    <main className="mx-auto max-w-[1300px] px-[var(--gutter)] pb-40 pt-[150px] md:pt-[190px]">
      <ShopHero />

      <section aria-labelledby="nouveautes" className="pt-32 md:pt-48">
        <Reveal>
          <p className={label}>Vient d&rsquo;arriver</p>
          <h2 id="nouveautes" className={h2}>Nouveautés</h2>
          <p className="mt-6 max-w-lg text-mist t-lead">Affichez vos couleurs avec nos dernières pièces. Séries limitées : une fois épuisées, elles ne reviennent pas.</p>
        </Reveal>
        <ul className="mt-14 grid gap-x-8 gap-y-16 sm:grid-cols-2 lg:grid-cols-3">
          {fresh.map((p, i) => (
            <li key={p.id}>
              <Reveal delay={i * 0.08}>
                <ProductCard product={p} priority={i === 0} />
              </Reveal>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="engagement" className="pt-32 md:pt-48">
        <Reveal>
          <h2 id="engagement" className={`${h2} max-w-[18ch]`}>Chaque achat fait vivre le groupe</h2>
          <p className="mt-6 max-w-lg text-mist t-lead">Les bénéfices de la boutique financent les soirées, les déplacements et les actions solidaires des Dames du Parc.</p>
        </Reveal>
        <Reveal className="mt-14 grid gap-5 md:grid-cols-[1.35fr_1fr]">
          <div className="relative min-h-[420px] overflow-hidden rounded-[22px] md:min-h-[560px]">
            <Image src="/images/produit-echarpe.webp" alt="Une supportrice brandit l'écharpe Fière d'être parisienne dans les tribunes du Parc des Princes" fill sizes="(min-width: 768px) 55vw, 100vw" className="object-cover object-[50%_20%]" />
          </div>
          <div className="flex flex-col justify-end rounded-[22px] bg-[#0b1327] p-8 md:p-10">
            <p className="font-display text-[clamp(26px,3vw,38px)] font-semibold uppercase leading-[1.05] tracking-[0.04em] text-white">Faite par les tribunes, pour Paris</p>
            <JoinSectionGate>
              <p className="mt-5 text-mist t-small">Rejoignez le groupe pour profiter d&rsquo;avantages sur la boutique et vivre la saison avec nous.</p>
              <JoinGate>
                <Link href="/rejoindre-le-groupe" className="group mt-8 inline-flex min-h-11 items-center gap-2 font-body text-[14px] font-medium text-white">
                  Rejoindre le groupe <ArrowRight aria-hidden className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
              </JoinGate>
            </JoinSectionGate>
          </div>
        </Reveal>
      </section>

      <section id="collection" aria-labelledby="collection-title" className="scroll-mt-32 pt-32 md:pt-48">
        <Reveal>
          <p className={label}>Toute la boutique</p>
          <h2 id="collection-title" className={`${h2} mb-14`}>La collection</h2>
        </Reveal>
        <Catalog />
      </section>
    </main>
  );
}
