import Link from "next/link";
import { ArrowRight, type LucideIcon } from "lucide-react";
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
  icon?: LucideIcon;
  className?: string;
  children: ReactNode;
}

const base =
  "group/btn inline-flex items-center justify-center gap-3 whitespace-nowrap font-body font-medium select-none rounded-[10px] " +
  "transition-[transform,background-color,border-color,filter] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] " +
  "hover:-translate-y-[2px] active:translate-y-0 min-h-11";

const variants: Record<Variant, string> = {
  primary:
    "border border-[#ff6b80]/45 bg-[linear-gradient(180deg,#e51b36_0%,#b30d27_100%)] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.22),0_12px_30px_-14px_rgba(217,15,44,0.85)] hover:brightness-110",
  outline: "border border-white/[0.12] bg-[#121417]/90 text-white hover:border-white/30 hover:bg-[#1b1e23]",
};

const sizes: Record<Size, string> = {
  lg: "h-[54px] px-7 text-[15.5px]",
  sm: "h-11 px-5 text-[14px]",
  xs: "h-10 px-4 text-[12.5px] gap-2.5",
};

export function Button({ variant = "primary", size = "sm", href, external, download, arrow = true, icon: Icon, className, children }: Props) {
  const classes = cn(base, variants[variant], sizes[size], className);
  const content = (
    <>
      {Icon && <Icon aria-hidden className={size === "lg" ? "size-5" : "size-[18px]"} strokeWidth={1.7} />}
      <span>{children}</span>
      {arrow && (
        <ArrowRight
          aria-hidden
          className={cn(
            "transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/btn:translate-x-1",
            size === "lg" ? "size-5" : "size-4",
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

