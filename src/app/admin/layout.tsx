import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = { title: { default: "Administration", template: "%s · Administration" }, robots: { index: false, follow: false } };

export default function AdminRootLayout({ children }: { children: ReactNode }) {
  return <div id="contenu" className="min-h-svh bg-night-950 text-ivory">{children}</div>;
}
