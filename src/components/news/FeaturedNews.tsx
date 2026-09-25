import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { formatShortDate } from "@/lib/format";
import type { NewsItem } from "@/types";
import { Tone } from "./NewsCard";

export function FeaturedNews({ item }: { item: NewsItem }) {
  return (
    <Link
      href={item.href}
      data-cursor="view"
      className="group grid overflow-hidden rounded-[16px] border border-white/[0.08] bg-[#0b1327] transition-colors duration-500 hover:border-white/25 md:min-h-[440px] md:grid-cols-[0.85fr_1.15fr]"
    >
      <div className="order-2 flex flex-col justify-between gap-12 p-8 md:order-1 md:p-12">
        <div>
          <p className="font-body text-[13px] font-medium text-[#ff7a8c]">{item.category}</p>
          <h2 className="mt-5 font-body text-[clamp(26px,3vw,38px)] font-medium leading-[1.15] tracking-[-0.015em] text-white">{item.title}</h2>
          <p className="mt-5 max-w-md font-body text-[15.5px] leading-[1.75] text-mist">{item.excerpt}</p>
        </div>
        <div className="flex items-center justify-between font-body text-[13px] text-mist">
          <time dateTime={item.date}>{formatShortDate(item.date)}</time>
          <span className="inline-flex items-center gap-2 text-white/80 transition-colors group-hover:text-white">
            Lire l&rsquo;article <ArrowRight aria-hidden className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
          </span>
        </div>
      </div>
      <div className="relative order-1 aspect-[16/10] overflow-hidden md:order-2 md:aspect-auto">
        <Image
          src={item.image}
          alt={item.imageAlt}
          fill
          priority
          sizes="(min-width: 768px) 60vw, 100vw"
          className="object-cover saturate-[0.85] transition-transform duration-[1400ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04]"
        />
        <Tone />
      </div>
    </Link>
  );
}
