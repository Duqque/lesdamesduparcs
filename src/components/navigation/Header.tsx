"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { IdCard, Menu, User as UserIcon, X } from "lucide-react";
import { joinLink, leftNav, rightNav } from "@/data/navigation";
import { useScrolled } from "@/hooks/useScrolled";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/Button";
import { MobileMenu } from "./MobileMenu";
import { SoundToggle } from "./SoundToggle";

/** Bouton carré sombre, dans le style des boutons d'icône du site de référence. */
export const squareBtn =
  "relative grid size-11 place-items-center rounded-[10px] border border-white/[0.12] bg-[#121417]/90 text-white/85 transition-[background-color,border-color,color] duration-300 hover:border-white/30 hover:bg-[#1b1e23] hover:text-white";

function NavLinks({ items, pathname }: { items: typeof leftNav; pathname: string }) {
  return (
    <>
      {items.map((item) => {
        const active = pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "group/nav relative flex min-h-11 items-center font-body text-[14px] font-medium tracking-[0.01em] transition-colors duration-300",
              active ? "text-white" : "text-white/70 hover:text-white",
            )}
          >
            {item.label}
            <span
              aria-hidden
              className={cn(
                "absolute inset-x-0 bottom-[6px] h-px origin-center bg-psg-red-bright transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
                active ? "scale-x-100" : "scale-x-0 group-hover/nav:scale-x-100",
              )}
            />
          </Link>
        );
      })}
    </>
  );
}

export function Header() {
  const pathname = usePathname();
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
          "fixed inset-x-0 top-0 z-50 transition-[height,background-color,border-color,backdrop-filter] duration-300",
          "h-[72px] lg:h-[var(--header-h)]",
          scrolled || open
            ? "border-b border-white/[0.07] bg-night-950/88 backdrop-blur-md lg:h-[76px]"
            : "border-b border-transparent bg-transparent",
        )}
      >
        <div className="mx-auto grid h-full max-w-[1800px] grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center px-[var(--gutter)]">
          {/* Gauche */}
          <div className="flex items-center">
            <button
              type="button"
              aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
              aria-expanded={open}
              aria-controls="mobile-menu"
              onClick={() => setOpen((v) => !v)}
              className={cn(squareBtn, "lg:hidden")}
            >
              {open ? <X aria-hidden className="size-5" /> : <Menu aria-hidden className="size-5" />}
            </button>
            <nav aria-label="Navigation principale" className="hidden items-center justify-end gap-[clamp(28px,3.4vw,64px)] lg:flex lg:w-full lg:justify-end lg:pr-[clamp(32px,4vw,80px)]">
              <NavLinks items={leftNav} pathname={pathname} />
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
            <nav aria-label="Navigation secondaire" className="hidden items-center gap-[clamp(28px,3.4vw,64px)] lg:flex lg:pl-[clamp(32px,4vw,80px)]">
              <NavLinks items={rightNav} pathname={pathname} />
            </nav>
            <span className="hidden lg:block lg:flex-1" />
            <SoundToggle className={cn(squareBtn, "size-11")} />
            <Link href="/profil" aria-label="Mon compte" className={squareBtn}>
              <UserIcon aria-hidden className="size-[19px]" strokeWidth={1.7} />
            </Link>
            <div className="ml-1 hidden md:block">
              <Button href={joinLink.href} size="sm" icon={IdCard} arrow={false}>
                <span className="xl:hidden">Rejoindre</span>
                <span className="hidden xl:inline">{joinLink.label}</span>
              </Button>
            </div>
          </div>
        </div>
      </header>
      <MobileMenu open={open} pathname={pathname} onNavigate={() => setOpen(false)} />
    </>
  );
}
