import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { formatCompactDate } from "@/lib/format";
import type { NewsItem } from "@/types";

export function NewsList({ items }: { items: NewsItem[] }) {
  return (
    <section aria-labelledby="news-title" className="rounded-[6px] border border-line bg-night-900/85 px-6 pb-4 pt-5 backdrop-blur-sm">
      <div className="flex items-center justify-between">
        <h2 id="news-title" className="font-body text-[13px] font-bold uppercase tracking-[0.1em] text-white">
          Actualités
        </h2>
        <Link href="/actualites" className="group/all flex min-h-11 items-center gap-1.5 font-body text-[11.5px] font-semibold text-white/90 hover:text-white">
          Voir tout
          <ArrowRight aria-hidden className="size-3.5 transition-transform duration-300 group-hover/all:translate-x-1" />
        </Link>
      </div>
      <ul className="md:grid md:grid-cols-2 md:gap-x-8 xl:block">
        {items.map((item) => (
          <li key={item.id}>
            <Link href={item.href} className="group relative flex items-center gap-5 py-5">
              <span className="relative h-[76px] w-[84px] shrink-0 overflow-hidden rounded-[3px]" data-cursor="view">
                <Image
                  src={item.image}
                  alt=""
                  fill
                  sizes="84px"
                  className="object-cover transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.08]"
                />
              </span>
              <span className="min-w-0 flex-1 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-1">
                <span className="block font-body text-[13px] font-semibold leading-[1.5] text-white">{item.title}</span>
                <span className="mt-2.5 block font-body text-[11.5px] text-mist">
                  <span className="font-semibold uppercase tracking-[0.06em] text-psg-red-bright">{item.category}</span>
                  <span aria-hidden> · </span>
                  <time dateTime={item.date}>{formatCompactDate(item.date)}</time>
                </span>
              </span>
              <span
                aria-hidden
                className="absolute bottom-0 left-0 h-px w-full origin-left scale-x-0 bg-psg-red transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-x-100"
              />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
