"use client";

import Image from "next/image";
import Link from "next/link";
import { IdCard, LogIn, LogOut, Menu, User, X } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { CartButton } from "@/components/shop/CartButton";
import { cn } from "@/lib/cn";

/** Logo affiché uniquement sur mobile et tablette : remplacer ce fichier suffit à le changer (le logo du site sur ordinateur reste inchangé). */
export const MOBILE_LOGO = "/logos/dames-du-parc-mobile.webp";

const square = "relative grid size-[52px] shrink-0 place-items-center rounded-[14px] border text-white transition-[background-color,border-color] duration-300";
const dark = "border-white/[0.12] bg-[#0d0f13] hover:border-white/30 hover:bg-[#161a20]";

/**
 * Barre de navigation mobile / tablette, fixée en bas de l'écran : mon espace ou adhésion, panier, logo, menu, connexion.
 * (Le bouton du son n'existe pas sur mobile.)
 */
export function MobileDock({ open, onToggle, onClose }: { open: boolean; onToggle: () => void; onClose: () => void }) {
  const { session, logout } = useAuth();
  const signedIn = session.status === "member" || session.status === "admin";
  return (
    <nav
      aria-label="Navigation principale"
      className="fixed inset-x-0 bottom-0 z-50 flex items-center justify-center gap-2 px-3 pb-[max(12px,env(safe-area-inset-bottom))] lg:hidden"
    >
      {signedIn ? (
        <Link href="/profil" aria-label="Mon espace" onClick={onClose} className={cn(square, "border-psg-red-bright/50 bg-gradient-to-br from-psg-red-bright to-[#8f0a1f] hover:brightness-110")}>
          <User aria-hidden className="size-[22px]" strokeWidth={1.7} />
        </Link>
      ) : (
        <Link href="/rejoindre-le-groupe" aria-label="Devenir membre" onClick={onClose} className={cn(square, "border-psg-red-bright/50 bg-gradient-to-br from-psg-red-bright to-[#8f0a1f] hover:brightness-110")}>
          <IdCard aria-hidden className="size-[22px]" strokeWidth={1.7} />
        </Link>
      )}

      <div className="flex min-w-0 flex-1 items-center justify-between gap-2 rounded-[18px] border border-white/[0.12] bg-[#050608]/95 p-2 shadow-[0_18px_40px_-16px_rgba(0,0,0,0.9)] backdrop-blur-md sm:max-w-[420px] sm:flex-none sm:basis-[420px]">
        <CartButton className={cn(square, dark, "size-[52px]")} />
        <Link href="/" aria-label="Les Dames du Parc, accueil" onClick={onClose} className="relative mx-1 block h-[46px] min-w-0 flex-1 transition-transform duration-300 active:scale-95">
          <Image src={MOBILE_LOGO} alt="" fill sizes="(min-width: 640px) 200px, 40vw" className="object-contain" />
        </Link>
        <button
          type="button"
          aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
          aria-expanded={open}
          aria-controls="mobile-menu"
          onClick={onToggle}
          className={cn(square, dark)}
        >
          {open ? <X aria-hidden className="size-6" strokeWidth={1.7} /> : <Menu aria-hidden className="size-6" strokeWidth={1.7} />}
        </button>
      </div>

      {signedIn ? (
        <button type="button" aria-label="Se déconnecter" onClick={() => { onClose(); void logout(); }} className={cn(square, dark, "text-white/80")}>
          <LogOut aria-hidden className="size-[22px]" strokeWidth={1.7} />
        </button>
      ) : (
        <Link href="/connexion" aria-label="Se connecter" onClick={onClose} className={cn(square, dark, "text-white/80")}>
          <LogIn aria-hidden className="size-[22px]" strokeWidth={1.7} />
        </Link>
      )}
    </nav>
  );
}
