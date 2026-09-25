"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Bell, Menu, Search, User as UserIcon, X } from "lucide-react";
import { mainNav, signature } from "@/data/navigation";
import { currentMember } from "@/data/members";
import { useScrolled } from "@/hooks/useScrolled";
import { cn } from "@/lib/cn";
import { MobileMenu } from "./MobileMenu";
import { SoundToggle } from "./SoundToggle";

const iconBtn =
  "relative grid size-11 place-items-center rounded-full text-white/90 transition-colors duration-200 hover:bg-white/10 hover:text-white";

export function Header() {
  const pathname = usePathname();
  const scrolled = useScrolled(24);
  const [open, setOpen] = useState(false);
  const unread = currentMember.notifications.filter((n) => !n.read).length;

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
          "fixed inset-x-0 top-0 z-50 border-b border-white/[0.06] transition-[height,background-color,box-shadow] duration-300",
          "h-[64px] lg:h-[76px]",
          scrolled || open
            ? "bg-night-950/90 shadow-[0_12px_40px_-20px_rgba(0,0,0,0.9)] backdrop-blur-md lg:h-[60px]"
            : "bg-night-950/70 backdrop-blur-[6px]",
        )}
      >
        <div className="relative mx-auto flex h-full max-w-[1800px] items-center px-[var(--gutter)]">
          <Link
            href="/"
            aria-label="Les Dames du Parc — accueil"
            onClick={() => setOpen(false)}
            className={cn(
              "z-10 shrink-0 rounded-full transition-[width,height,top] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
              "relative size-[46px]",
              "lg:absolute lg:left-[var(--gutter)]",
              scrolled ? "lg:top-[6px] lg:size-[48px]" : "lg:top-[10px] lg:size-[clamp(96px,8.6vw,138px)]",
            )}
          >
            <Image
              src="/logos/dames-du-parc-logo.webp"
              alt="Les Dames du Parc"
              width={280}
              height={280}
              priority
              sizes="(min-width: 1024px) 138px, 46px"
              className="size-full rounded-full object-contain drop-shadow-[0_8px_18px_rgba(0,0,0,0.55)]"
            />
          </Link>

          <nav
            aria-label="Navigation principale"
            className="hidden h-full items-stretch gap-[clamp(18px,2.6vw,50px)] lg:ml-[calc(clamp(96px,8.6vw,138px)+clamp(24px,3.2vw,50px))] lg:flex"
          >
            {mainNav.map((item) => {
              const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "group/nav relative flex items-center font-body text-[12px] font-semibold uppercase tracking-[0.03em] transition-colors duration-200 xl:text-[13px]",
                    active ? "text-white" : "text-white/80 hover:text-white",
                  )}
                >
                  {item.label}
                  <span
                    aria-hidden
                    className={cn(
                      "absolute inset-x-[-6px] bottom-0 h-[3px] origin-left bg-psg-red transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
                      active ? "scale-x-100" : "scale-x-0 group-hover/nav:scale-x-100",
                    )}
                  />
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center">
            <p
              aria-label={signature.join(", ")}
              className="mr-6 hidden select-none font-body text-[10.5px] uppercase tracking-[0.28em] text-mist min-[1440px]:block"
            >
              {signature.join(" · ")}
            </p>
            <SoundToggle />
            <button type="button" aria-label="Rechercher" className={cn(iconBtn, "hidden sm:grid")}>
              <Search aria-hidden className="size-[19px]" strokeWidth={1.8} />
            </button>
            <button type="button" aria-label={`Notifications${unread ? `, ${unread} non lue${unread > 1 ? "s" : ""}` : ""}`} className={cn(iconBtn, "hidden sm:grid")}>
              <Bell aria-hidden className="size-[19px]" strokeWidth={1.8} />
              {unread > 0 && <span aria-hidden className="absolute right-[10px] top-[9px] size-[7px] rounded-full bg-psg-red ring-2 ring-night-950" />}
            </button>
            <Link href="/profil" aria-label="Mon compte" className={iconBtn}>
              <UserIcon aria-hidden className="size-[19px]" strokeWidth={1.8} />
            </Link>
            <button
              type="button"
              aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
              aria-expanded={open}
              aria-controls="mobile-menu"
              onClick={() => setOpen((v) => !v)}
              className={cn(iconBtn, "lg:hidden")}
            >
              {open ? <X aria-hidden className="size-[22px]" /> : <Menu aria-hidden className="size-[22px]" />}
            </button>
          </div>
        </div>
      </header>
      <MobileMenu open={open} pathname={pathname} onNavigate={() => setOpen(false)} />
    </>
  );
}
