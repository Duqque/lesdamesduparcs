import type { Metadata, Viewport } from "next";
import { Barlow_Condensed, Caveat, Inter, Marcellus } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/layout/Providers";
import { Header } from "@/components/navigation/Header";
import { Footer } from "@/components/footer/Footer";
import { INTRO_STORAGE_KEY } from "@/lib/intro-key";

const barlow = Barlow_Condensed({ subsets: ["latin"], weight: ["500", "600", "700"], variable: "--font-barlow", display: "swap" });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const marcellus = Marcellus({ subsets: ["latin"], weight: "400", variable: "--font-marcellus", display: "swap" });
const caveat = Caveat({ subsets: ["latin"], weight: ["500", "600"], variable: "--font-caveat", display: "swap" });

export const metadata: Metadata = {
  title: {
    default: "Les Dames du Parc : plus qu'un groupe, une famille",
    template: "%s · Les Dames du Parc",
  },
  description:
    "Les Dames du Parc, groupe de supportrices 100 % féminin du Paris Saint-Germain : passion, partage, féminité. Au Parc des Princes et partout.",
  openGraph: {
    title: "Les Dames du Parc",
    description: "Plus qu'un groupe, une famille. Supportrices du Paris Saint-Germain.",
    locale: "fr_FR",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#030919",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className={`${barlow.variable} ${inter.variable} ${caveat.variable} ${marcellus.variable}`} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{if(sessionStorage.getItem("${INTRO_STORAGE_KEY}")==="1")document.documentElement.dataset.introSeen=""}catch(e){}`,
          }}
        />
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
        <Providers>
          <Header />
          <div id="contenu">{children}</div>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
