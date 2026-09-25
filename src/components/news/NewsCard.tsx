import Image from "next/image";
import Link from "next/link";
import { formatShortDate } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { NewsItem } from "@/types";

/** Voile bleu / rouge qui unifie des photos de sources différentes. */
export function Tone({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn("absolute inset-0 bg-[linear-gradient(135deg,rgba(24,52,128,0.55)_0%,rgba(10,20,52,0.35)_55%,rgba(217,15,44,0.22)_100%)] mix-blend-multiply", className)}
    />
  );
}

export function NewsCard({ item, className }: { item: NewsItem; className?: string }) {
  return (
    <Link
      href={item.href}
      data-cursor="view"
      className={cn(
        "group flex h-full flex-col overflow-hidden rounded-[14px] border border-white/[0.08] bg-[#0b1327] transition-[border-color,transform] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1 hover:border-white/25",
        className,
      )}
    >
      <div className="relative aspect-[16/11] overflow-hidden">
        <Image
          src={item.image}
          alt={item.imageAlt}
          fill
          sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 100vw"
          className="object-cover saturate-[0.85] transition-transform duration-[1200ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.05]"
        />
        <Tone />
      </div>
      <div className="flex flex-1 flex-col p-7">
        <p className="flex items-center gap-2.5 font-body text-[12.5px] text-mist">
          <span className="font-medium text-[#ff7a8c]">{item.category}</span>
          <span aria-hidden className="size-1 rounded-full bg-white/30" />
          <time dateTime={item.date}>{formatShortDate(item.date)}</time>
        </p>
        <h3 className="mt-4 font-body text-[21px] font-medium leading-[1.25] tracking-[-0.01em] text-white">{item.title}</h3>
        <p className="mt-3 line-clamp-3 text-mist t-small">{item.excerpt}</p>
      </div>
    </Link>
  );
}
