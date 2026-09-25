import type { Metadata, Viewport } from "next";
import { Barlow } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/layout/Providers";
import { SiteFrame } from "@/components/layout/SiteFrame";
import { Header } from "@/components/navigation/Header";
import { Footer } from "@/components/footer/Footer";
import { INTRO_STORAGE_KEY } from "@/lib/intro-key";
import { accentOverride, getNavConfig, siteMeta } from "@/lib/server/site";
import { getPublicCatalog } from "@/lib/server/shop";

/** Une seule famille typographique sur tout le site : seules la graisse et la casse varient. */
const barlow = Barlow({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700"], variable: "--font-barlow", display: "swap" });

export async function generateMetadata(): Promise<Metadata> {
  const site = await siteMeta();
  return {
    title: { default: `${site.title} : plus qu'un groupe, une famille`, template: `%s · ${site.title}` },
    description: site.description || "Les Dames du Parc, groupe de supportrices 100 % féminin du Paris Saint-Germain : passion, partage, féminité. Au Parc des Princes et partout.",
    openGraph: { title: site.title, description: "Plus qu'un groupe, une famille. Supportrices du Paris Saint-Germain.", locale: "fr_FR", type: "website" },
  };
}

export const viewport: Viewport = {
  themeColor: "#030919",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const [navConfig, accent, shop] = await Promise.all([getNavConfig(), accentOverride(), getPublicCatalog()]);
  return (
    <html lang="fr" className={barlow.variable} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{if(sessionStorage.getItem("${INTRO_STORAGE_KEY}")==="1")document.documentElement.dataset.introSeen=""}catch(e){}`,
          }}
        />
        {accent && <style>{`:root{--color-psg-red:${accent};--color-psg-red-bright:${accent}}`}</style>}
        <noscript>
          <style>{".intro-root{display:none}"}</style>
        </noscript>
      </head>
      <body className="min-h-svh">
        <a
          href="#contenu"
          className="fixed left-4 top-4 z-[110] -translate-y-24 rounded bg-psg-red px-4 py-3 font-body text-sm font-semibold text-white focus:translate-y-0"
        >
          Aller au contenu
        </a>
        <Providers shop={shop}>
          <SiteFrame header={<Header navConfig={navConfig} />} footer={<Footer />}>
            {children}
          </SiteFrame>
        </Providers>
      </body>
    </html>
  );
}
