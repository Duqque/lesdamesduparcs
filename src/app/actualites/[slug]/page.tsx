import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { DiscreetLinks } from "@/components/news/DiscreetLinks";
import { NewsCard, Tone } from "@/components/news/NewsCard";
import { Reveal } from "@/components/ui/Reveal";
import { getNewsItem, getPublishedNews } from "@/lib/server/content";
import { formatShortDate } from "@/lib/format";

export const revalidate = 300;

export async function generateStaticParams() {
  return (await getPublishedNews()).map((n) => ({ slug: n.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const item = await getNewsItem(slug);
  if (!item) return {};
  return { title: item.title, description: item.excerpt, openGraph: { title: item.title, description: item.excerpt, images: [item.image] } };
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const item = await getNewsItem(slug);
  if (!item) notFound();
  const more = (await getPublishedNews()).filter((n) => n.id !== item.id).slice(0, 3);

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
          {item.authorName && (<><span aria-hidden className="size-1 rounded-full bg-white/30" /><span>Par {item.authorName}</span></>)}
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
        {item.tags && item.tags.length > 0 && (
          <div className="mt-14 border-t border-white/10 pt-8">
            <p className="font-body text-[12px] font-semibold uppercase tracking-[0.2em] text-mist">Tags</p>
            <ul className="mt-4 flex flex-wrap gap-2">
              {item.tags.map((t) => (
                <li key={t}>
                  <Link href={`/actualites?tag=${encodeURIComponent(t)}`} className="inline-flex min-h-11 items-center rounded-full border border-white/[0.16] px-4 font-body text-[13.5px] text-white/85 transition-colors hover:border-psg-red-bright hover:text-white">
                    #{t}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
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
