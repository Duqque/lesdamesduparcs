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

/** `dense` : version compacte sur mobile (deux colonnes côte à côte). */
export function NewsCard({ item, className, dense }: { item: NewsItem; className?: string; dense?: boolean }) {
  return (
    <Link
      href={item.href}
      data-cursor="view"
      className={cn(
        "group flex h-full flex-col overflow-hidden rounded-[14px] border border-white/[0.08] bg-[#0b1327] transition-[border-color,transform] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1 hover:border-white/25",
        className,
      )}
    >
      <div className={cn("relative overflow-hidden", dense ? "aspect-[4/3] sm:aspect-[16/11]" : "aspect-[16/11]")}>
        <Image
          src={item.image}
          alt={item.imageAlt}
          fill
          sizes={dense ? "(min-width: 1024px) 30vw, 50vw" : "(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 100vw"}
          className="object-cover saturate-[0.85] transition-transform duration-[1200ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.05]"
        />
        <Tone />
      </div>
      <div className={cn("flex flex-1 flex-col", dense ? "p-3.5 sm:p-7" : "p-7")}>
        <p className={cn("flex flex-wrap items-center gap-x-2.5 gap-y-0.5 font-body text-mist", dense ? "text-[11px] sm:text-[12.5px]" : "text-[12.5px]")}>
          <span className="font-medium text-[#ff7a8c]">{item.category}</span>
          <span aria-hidden className={cn("size-1 rounded-full bg-white/30", dense && "hidden sm:block")} />
          <time dateTime={item.date}>{formatShortDate(item.date)}</time>
        </p>
        <h3 className={cn("font-body font-medium tracking-[-0.01em] text-white", dense ? "mt-2 text-[15px] leading-[1.25] sm:mt-4 sm:text-[21px]" : "mt-4 text-[21px] leading-[1.25]")}>{item.title}</h3>
        <p className={cn("text-mist", dense ? "t-caption mt-2 line-clamp-2 sm:t-small sm:mt-3 sm:line-clamp-3" : "t-small mt-3 line-clamp-3")}>{item.excerpt}</p>
      </div>
    </Link>
  );
}
