"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { PageViewTracker } from "./PageViewTracker";
import { CookieNotice } from "./CookieNotice";
import { ContactWindow } from "@/components/contact/ContactWindow";

/** Habillage du site public (en-tête, pied de page) : absent du back-office. */
export function SiteFrame({ header, footer, children, contactEmail }: { header: ReactNode; footer: ReactNode; children: ReactNode; contactEmail: string }) {
  const admin = usePathname().startsWith("/admin");
  if (admin) return <>{children}</>;
  return (
    <>
      <PageViewTracker />
      {header}
      <div id="contenu">{children}</div>
      <div className="max-lg:pb-[96px]">{footer}</div>
      <CookieNotice />
      <ContactWindow email={contactEmail} />
    </>
  );
}
