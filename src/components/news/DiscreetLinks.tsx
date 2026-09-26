import Link from "next/link";
import { ArrowRight, ArrowUpRight, Globe, IdCard, ShoppingBag } from "lucide-react";
import { SpotifyIcon } from "@/components/icons/BrandIcons";
import { discreetLinks, type DiscreetLink } from "@/data/links";
import { cn } from "@/lib/cn";

const icons = {
  join: IdCard,
  spotify: SpotifyIcon,
  psg: Globe,
  shop: ShoppingBag,
} as const;

function Item({ link }: { link: DiscreetLink }) {
  const Icon = icons[link.id];
  const Arrow = link.external ? ArrowUpRight : ArrowRight;
  const content = (
    <>
      <span className="flex items-center gap-2.5 font-body text-[12px] uppercase tracking-[0.2em] text-mist">
        <Icon aria-hidden className="size-4 text-white/70" strokeWidth={1.6} />
        {link.kicker}
      </span>
      <span className="mt-4 flex items-center justify-between gap-4 font-body text-[16px] font-medium text-white">
        {link.label}
        <Arrow aria-hidden className="size-4 shrink-0 text-white/50 transition-[transform,color] duration-300 group-hover:translate-x-1 group-hover:text-white" />
      </span>
      <span aria-hidden className="absolute inset-x-0 top-0 h-px origin-left scale-x-0 bg-psg-red-bright transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-x-100" />
    </>
  );
  const cls = "group relative block border-t border-white/12 pb-2 pt-6";
  return link.external ? (
    <a href={link.href} target="_blank" rel="noopener noreferrer" className={cls}>
      {content}
      <span className="sr-only"> (s&rsquo;ouvre dans un nouvel onglet)</span>
    </a>
  ) : (
    <Link href={link.href} className={cls}>
      {content}
    </Link>
  );
}

/** Liens discrets vers l'adhésion, la playlist, le site officiel et la boutique. */
export function DiscreetLinks({ className }: { className?: string }) {
  return (
    <nav aria-label="Aller plus loin" className={cn("grid gap-x-10 gap-y-2 sm:grid-cols-2 lg:grid-cols-4", className)}>
      {discreetLinks.map((l) => (
        <Item key={l.id} link={l} />
      ))}
    </nav>
  );
}
