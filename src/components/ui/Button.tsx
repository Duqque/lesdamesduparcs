import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "outline";
type Size = "xs" | "sm" | "lg";

interface Props {
  variant?: Variant;
  size?: Size;
  href?: string;
  external?: boolean;
  download?: boolean;
  arrow?: boolean;
  className?: string;
  children: ReactNode;
}

const base =
  "group/btn inline-flex items-center justify-center gap-2.5 whitespace-nowrap font-body font-semibold uppercase select-none " +
  "transition-[transform,background-color,border-color,filter] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] " +
  "hover:-translate-y-[3px] active:translate-y-0 min-h-11";

const variants: Record<Variant, string> = {
  primary: "bg-psg-red text-white hover:bg-psg-red-bright hover:brightness-110 shadow-[0_10px_30px_-12px_rgba(217,15,44,0.8)]",
  outline: "border border-white/55 text-white bg-night-950/25 backdrop-blur-[2px] hover:border-white hover:bg-white/10",
};

const sizes: Record<Size, string> = {
  lg: "h-12 px-6 text-[13px] tracking-[0.06em] rounded-[3px] md:h-[44px] md:text-[14px]",
  xs: "px-3 text-[10.5px] tracking-[0.03em] rounded-[3px] h-[34px] min-h-11 md:min-h-0",
  sm: "px-4 text-[11px] tracking-[0.05em] rounded-[3px] h-[34px] min-h-11 md:min-h-0",
};

export function Button({ variant = "primary", size = "sm", href, external, download, arrow = true, className, children }: Props) {
  const classes = cn(base, variants[variant], sizes[size], className);
  const content = (
    <>
      <span>{children}</span>
      {arrow && (
        <ArrowRight
          aria-hidden
          className={cn(
            "transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/btn:translate-x-1",
            size === "lg" ? "size-[18px]" : "size-[14px]",
          )}
          strokeWidth={2}
        />
      )}
    </>
  );

  if (!href) {
    return (
      <button type="button" className={classes}>
        {content}
      </button>
    );
  }
  if (download) {
    return (
      <a href={href} download className={classes}>
        {content}
      </a>
    );
  }
  if (external) {
    return (
      <a href={href} className={classes} target="_blank" rel="noopener noreferrer">
        {content}
      </a>
    );
  }
  return (
    <Link href={href} className={classes}>
      {content}
    </Link>
  );
}

