"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { PageViewTracker } from "./PageViewTracker";
import { CookieNotice } from "./CookieNotice";
import { ContactWindow } from "@/components/contact/ContactWindow";

/** Habillage du site public (en-tête, pied de page) : absent du back-office. */
export function SiteFrame({ header, footer, children, contactEmail }: { header: ReactNode; footer: ReactNode; children: ReactNode; contactEmail: string }) {
  const pathname = usePathname();
  if (pathname.startsWith("/admin")) return <>{children}</>;
  return (
    <>
      <PageViewTracker />
      {header}
      {/* Mobile et tablette : petit logo en haut de chaque page (l'accueil a son grand logo, qui s'efface au défilement). */}
      {pathname !== "/" && (
        <Link href="/" aria-label="Les Dames du Parc, accueil" className="absolute inset-x-0 top-0 z-30 mx-auto mt-[max(30px,calc(env(safe-area-inset-top)+14px))] block size-[67px] lg:hidden">
          <Image src="/logos/dames-du-parc-logo.webp" alt="" width={112} height={112} priority className="size-full drop-shadow-[0_6px_18px_rgba(0,0,0,0.55)]" />
        </Link>
      )}
      <div id="contenu">{children}</div>
      <div className="max-lg:pb-[96px]">{footer}</div>
      <CookieNotice />
      <ContactWindow email={contactEmail} />
    </>
  );
}
