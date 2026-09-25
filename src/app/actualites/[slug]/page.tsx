import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { DiscreetLinks } from "@/components/news/DiscreetLinks";
import { NewsCard, Tone } from "@/components/news/NewsCard";
import { Reveal } from "@/components/ui/Reveal";
import { getNews, news } from "@/data/news";
import { formatShortDate } from "@/lib/format";

export function generateStaticParams() {
  return news.map((n) => ({ slug: n.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const item = getNews(slug);
  if (!item) return {};
  return { title: item.title, description: item.excerpt, openGraph: { title: item.title, description: item.excerpt, images: [item.image] } };
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const item = getNews(slug);
  if (!item) notFound();
  const more = news.filter((n) => n.id !== item.id).slice(0, 3);

  return (
    <main className="overflow-x-clip">
      <article className="mx-auto max-w-[860px] px-[var(--gutter)] pb-24 pt-[200px] md:pt-[250px]">
        <Link href="/actualites" className="group inline-flex min-h-11 items-center gap-2 font-body text-[13px] font-medium text-white/75 transition-colors hover:text-white">
          <ArrowLeft aria-hidden className="size-4 transition-transform duration-300 group-hover:-translate-x-1" />
          Toutes les actualités
        </Link>
        <p className="mt-10 flex items-center gap-2.5 font-body text-[13px] text-mist">
          <span className="font-medium text-[#ff7a8c]">{item.category}</span>
          <span aria-hidden className="size-1 rounded-full bg-white/30" />
          <time dateTime={item.date}>{formatShortDate(item.date)}</time>
        </p>
        <h1 className="mt-5 t-h1">{item.title}</h1>
        <p className="mt-7 text-white/80 t-lead">{item.excerpt}</p>
        <div className="relative mt-14 aspect-[16/9] overflow-hidden rounded-[16px] border border-white/[0.08]">
          <Image src={item.image} alt={item.imageAlt} fill priority sizes="(min-width: 900px) 860px, 100vw" className="object-cover saturate-[0.85]" />
          <Tone />
        </div>
        <div className="mt-14 space-y-8 font-body text-[17px] leading-[1.95] text-white/80">
          {item.content.map((p) => (
            <p key={p}>{p}</p>
          ))}
        </div>
        <DiscreetLinks className="mt-24" />
      </article>

      <section aria-labelledby="lire-aussi" className="mx-auto max-w-[1240px] px-[var(--gutter)] pb-36">
        <h2 id="lire-aussi" className="font-body text-[22px] font-medium tracking-[-0.01em] text-white">
          À lire aussi
        </h2>
        <ul className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3 lg:gap-10">
          {more.map((n) => (
            <li key={n.id}>
              <Reveal className="h-full">
                <NewsCard item={n} />
              </Reveal>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
