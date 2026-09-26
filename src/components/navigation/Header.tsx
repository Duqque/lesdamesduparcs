"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fragment, useEffect, useState } from "react";
import { ChevronDown, IdCard, Mail } from "lucide-react";
import { joinLink, leftNav, mainNav, rightNav } from "@/data/navigation";
import { applyNav, type NavConfig } from "@/lib/nav-config";
import { useScrolled } from "@/hooks/useScrolled";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/Button";
import { MobileMenu } from "./MobileMenu";
import { MobileDock } from "./MobileDock";
import { CartButton } from "@/components/shop/CartButton";
import { AccountMenu } from "./AccountMenu";
import { SoundToggle } from "./SoundToggle";

/** Bouton carré sombre, dans le style des boutons d'icône du site de référence. */
export const squareBtn =
  "relative grid size-11 place-items-center rounded-[10px] border border-white/[0.12] bg-[#121417]/90 text-white/85 transition-[background-color,border-color,color] duration-300 hover:border-white/30 hover:bg-[#1b1e23] hover:text-white";

function NavLinks({ items, pathname }: { items: typeof leftNav; pathname: string }) {
  return (
    <>
      {items.map((item) => {
        const active = pathname.startsWith(item.href);
        const link = (
          <Link
            href={item.href}
            aria-current={pathname === item.href ? "page" : undefined}
            className={cn(
              "group/nav relative flex min-h-11 items-center gap-1.5 font-body text-[14px] font-medium tracking-[0.01em] transition-colors duration-300",
              active ? "text-white" : "text-white/70 hover:text-white",
            )}
          >
            {item.label}
            {item.children && <ChevronDown aria-hidden className="size-3.5 transition-transform duration-300 group-hover/menu:rotate-180 group-focus-within/menu:rotate-180" />}
            <span
              aria-hidden
              className={cn(
                "absolute inset-x-0 bottom-[6px] h-px origin-center bg-psg-red-bright transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
                active ? "scale-x-100" : "scale-x-0 group-hover/nav:scale-x-100",
              )}
            />
          </Link>
        );
        if (!item.children) return <Fragment key={item.href}>{link}</Fragment>;
        return (
          <div key={item.href} className="group/menu relative">
            {link}
            <div className="invisible absolute left-0 top-full z-50 w-[min(640px,calc(100vw-48px))] pt-3 opacity-0 transition-[opacity,visibility] duration-200 group-focus-within/menu:visible group-focus-within/menu:opacity-100 group-hover/menu:visible group-hover/menu:opacity-100">
              <ul className="grid grid-cols-2 gap-1 overflow-hidden rounded-[10px] border border-white/[0.1] bg-night-950/95 p-3 shadow-[0_30px_60px_-30px_rgba(0,0,0,0.9)] backdrop-blur-md">
                {item.children.map((c) => (
                  <li key={c.href} className="min-w-0">
                    <Link
                      href={c.href}
                      aria-current={pathname === c.href ? "page" : undefined}
                      className={cn(
                        "flex min-h-11 items-center gap-3 rounded-[8px] px-3 py-2 font-body text-[14px] leading-tight transition-colors duration-200 hover:bg-white/[0.07] hover:text-white",
                        pathname === c.href ? "bg-white/[0.06] text-white" : "text-white/75",
                      )}
                    >
                      <span aria-hidden className="h-4 w-0.5 shrink-0 rounded-full bg-psg-red-bright" />
                      <span className="min-w-0 break-words">{c.label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        );
      })}
    </>
  );
}

export function Header({ navConfig }: { navConfig?: NavConfig }) {
  const pathname = usePathname();
  const apply = (items: typeof leftNav) => applyNav(items, navConfig ?? { hidden: [], labels: {} });
  const scrolled = useScrolled(24);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-50 hidden transition-[height,background-color,border-color,backdrop-filter] duration-300 lg:block",
          "lg:h-[var(--header-h)]",
          scrolled || open
            ? "border-b border-white/[0.07] bg-night-950/88 backdrop-blur-md lg:h-[76px]"
            : "border-b border-transparent bg-transparent",
        )}
      >
        <div className="grid h-full grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center px-[clamp(14px,1.6vw,32px)]">
          {/* Gauche */}
          <div className="flex items-center gap-3">
            <div className="hidden lg:block">
              <Button href={joinLink.href} size="sm" icon={IdCard} arrow={false}>
                <span className="xl:hidden">Rejoindre</span>
                <span className="hidden xl:inline">{joinLink.label}</span>
              </Button>
            </div>
            <nav aria-label="Navigation principale" className="hidden items-center gap-[clamp(28px,3.4vw,64px)] lg:ml-auto lg:flex lg:pr-[clamp(24px,3vw,64px)]">
              <NavLinks items={apply(leftNav)} pathname={pathname} />
            </nav>
          </div>

          {/* Centre : logo */}
          <Link href="/" aria-label="Les Dames du Parc, accueil" onClick={() => setOpen(false)} className="relative block size-[52px] rounded-full transition-transform duration-500 hover:scale-105 lg:size-[60px]">
            <Image
              src="/logos/dames-du-parc-logo.webp"
              alt="Les Dames du Parc"
              width={120}
              height={120}
              priority
              sizes="60px"
              className="size-full rounded-full object-contain"
            />
          </Link>

          {/* Droite */}
          <div className="flex items-center justify-end gap-3">
            <nav aria-label="Navigation secondaire" className="hidden items-center gap-[clamp(28px,3.4vw,64px)] lg:flex lg:pl-[clamp(24px,3vw,64px)]">
              <NavLinks items={apply(rightNav)} pathname={pathname} />
            </nav>
            <span className="hidden lg:block lg:flex-1" />
            <Link href="/contact" aria-label="Contact" className={squareBtn}><Mail aria-hidden className="size-[19px]" strokeWidth={1.7} /></Link>
            <CartButton className={squareBtn} />
            <AccountMenu buttonClassName={squareBtn} />
          </div>
        </div>
      </header>
      <MobileDock open={open} onToggle={() => setOpen((v) => !v)} onClose={() => setOpen(false)} />
      <SoundToggle className="fixed bottom-6 right-6 z-40 hidden size-12 place-items-center rounded-full border border-white/[0.14] bg-[#0d0f13]/90 text-white/85 shadow-[0_12px_30px_-12px_rgba(0,0,0,0.9)] backdrop-blur-md transition-[background-color,border-color,color] duration-300 hover:border-white/35 hover:bg-[#161a20] hover:text-white lg:grid" />
      <MobileMenu open={open} pathname={pathname} items={apply(mainNav)} onNavigate={() => setOpen(false)} />
    </>
  );
}
