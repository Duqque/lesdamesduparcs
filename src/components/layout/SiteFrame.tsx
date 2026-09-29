"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { PageViewTracker } from "./PageViewTracker";
import { CookieNotice } from "./CookieNotice";
import { FlashBanner } from "./FlashBanner";
import { ContactWindow } from "@/components/contact/ContactWindow";

/** Habillage du site public (en-tête, pied de page) : absent du back-office. */
export function SiteFrame({ header, footer, children, contactEmail, flash }: { header: ReactNode; footer: ReactNode; children: ReactNode; contactEmail: string; flash: { message: string; id: string } | null }) {
  const pathname = usePathname();
  if (pathname.startsWith("/admin")) return <>{children}</>;
  return (
    <>
      <PageViewTracker />
      {flash && <FlashBanner message={flash.message} id={flash.id} />}
      {header}
      {/* Mobile et tablette : petit logo en haut de chaque page (l'accueil a son grand logo, qui s'efface au défilement). Décalé sous la bannière flash le cas échéant. */}
      {pathname !== "/" && (
        <Link href="/" aria-label="Les Dames du Parc, accueil" style={{ marginTop: "calc(max(30px, env(safe-area-inset-top) + 14px) + var(--flash-h, 0px))" }} className="absolute inset-x-0 top-0 z-30 mx-auto block size-[67px] lg:hidden">
          <Image src="/logos/dames-du-parc-logo.webp" alt="" width={112} height={112} priority className="size-full drop-shadow-[0_6px_18px_rgba(0,0,0,0.55)]" />
        </Link>
      )}
      <div id="contenu" style={{ paddingTop: "var(--flash-h, 0px)" }}>{children}</div>
      <div className="max-lg:pb-[96px]">{footer}</div>
      <CookieNotice />
      <ContactWindow email={contactEmail} />
    </>
  );
}
