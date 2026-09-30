import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { headers } from "next/headers";
import "./globals.css";
import { Providers } from "@/components/layout/Providers";
import { ErrorScreen } from "@/components/errors/ErrorScreen";
import { errorBySlug } from "@/data/errors";
import { errorPhotoFor } from "@/lib/server/error-photos";
import { getPageState, isAdminPreview } from "@/lib/server/page-gate";
import { TextGuard } from "@/components/layout/TextGuard";
import { SiteFrame } from "@/components/layout/SiteFrame";
import { Header } from "@/components/navigation/Header";
import { Footer } from "@/components/footer/Footer";
import { INTRO_STORAGE_KEY } from "@/lib/intro-key";
import { accentOverride, getNavConfig, siteMeta } from "@/lib/server/site";
import { settings } from "@/lib/server/admin-store";
import { getPublicCatalog } from "@/lib/server/shop";
import { getSession } from "@/lib/server/session";
import { getMemberByNumber } from "@/lib/server/store";
import { adhesionCapStatus, membershipState } from "@/lib/server/business";
import type { Session } from "@/components/auth/AuthProvider";

/**
 * Deux familles : Geomini (police variable, graisses 200 à 800) pour les sous-titres, les paragraphes et tout le corps de texte ;
 * Special Gothic Expanded One (une seule graisse) pour les titres importants. Fichiers auto-hébergés dans src/fonts.
 */
const geomini = localFont({ src: "../fonts/Geomini-Variable.woff2", weight: "200 800", variable: "--font-geomini", display: "swap" });
const gothic = localFont({ src: "../fonts/SpecialGothicExpandedOne-Regular.woff2", weight: "400", variable: "--font-gothic", display: "swap" });

export async function generateMetadata(): Promise<Metadata> {
  const site = await siteMeta();
  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "https://www.lesdamesduparc.com"),
    title: { default: `${site.title} : plus qu'un groupe, une famille`, template: `%s · ${site.title}` },
    description: site.description || "Les Dames du Parc, communauté 100 % féminine de supportrices du Paris Saint-Germain : passion, partage, féminité. Au Parc des Princes et partout.",
    openGraph: { title: site.title, description: "Plus qu'un groupe, une famille. Supportrices du Paris Saint-Germain.", locale: "fr_FR", type: "website" },
  };
}

export const viewport: Viewport = {
  themeColor: "#030919",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  const [navConfig, accent, shop, conf] = await Promise.all([getNavConfig(), accentOverride(), getPublicCatalog(), settings.get()]);
  const contactEmail = conf.association.email || "contact@lesdamesduparc.com";
  // La membre connectée est connue dès le rendu serveur (état de son abonnement compris) : pas de « saut » des appels à l'adhésion.
  // Maintenance de tout le site (état de la page « * ») : les visiteuses voient l'écran de maintenance, l'administration reste accessible.
  const path = (await headers()).get("x-pathname") ?? "";
  const siteState = await getPageState("*");
  const blocked = siteState.state !== "live" && !path.startsWith("/admin") && !path.startsWith("/erreur") && !(await isAdminPreview());
  const s = await getSession().catch(() => null);
  const stored = s?.role === "member" ? await getMemberByNumber(s.memberNumber) : null;
  const initialSession: Session | undefined =
    s?.role === "member" ? { status: "member", firstName: s.firstName, lastName: s.lastName, email: s.email, memberNumber: s.memberNumber, membership: stored ? await membershipState(stored.id) : "none" } : undefined;
  const capStatus = await adhesionCapStatus();
  const initialCapReached = capStatus.blocked;
  // Bannière : places restantes de la campagne d'adhésions en cours (en direct), prime sur le message libre de l'administration.
  const campaignFlash = conf.adhesions.paused
    ? { message: "Les adhésions sont actuellement en pause.", id: `paused:${conf.adhesions.limit}` }
    : {
        message: capStatus.blocked
          ? "Les adhésions sont actuellement complètes."
          : `Les adhésions sont ouvertes : ${capStatus.remaining} place${capStatus.remaining > 1 ? "s" : ""} restante${capStatus.remaining > 1 ? "s" : ""} !`,
        id: `open:${conf.adhesions.limit}`,
      };
  // Le message libre (Site internet > Bannière flash) prend le relais uniquement si la bannière d'adhésions est un jour rendue facultative.
  const genericFlash = conf.flash && new Date(conf.flash.until) > new Date() ? { message: conf.flash.message, id: conf.flash.until } : null;
  const flash = campaignFlash ?? genericFlash;
  return (
    <html lang="fr" className={`${geomini.variable} ${gothic.variable}`} suppressHydrationWarning>
      <head>
        <script
          nonce={nonce}
          dangerouslySetInnerHTML={{
            __html: `try{if(sessionStorage.getItem("${INTRO_STORAGE_KEY}")==="1"||document.referrer.indexOf(location.origin)===0)document.documentElement.dataset.introSeen=""}catch(e){}`,
          }}
        />
        {accent && <style>{`:root{--color-psg-red:${accent};--color-psg-red-bright:${accent}}`}</style>}
        {flash && <style>{`:root{--flash-h:44px}`}</style>}
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
        <TextGuard />
        {blocked ? (
          <ErrorScreen
            page={{ ...errorBySlug(siteState.state === "maintenance" ? "maintenance" : "bientot-disponible")!, ...(siteState.message?.trim() ? { text: siteState.message.trim() } : {}) }}
            photo={await errorPhotoFor(siteState.state === "maintenance" ? "maintenance" : "bientot-disponible")}
          />
        ) : (
        <Providers shop={shop} initialSession={initialSession} initialCapReached={initialCapReached}>
          <SiteFrame header={<Header navConfig={navConfig} />} footer={<Footer />} contactEmail={contactEmail} flash={flash}>
            {children}
          </SiteFrame>
        </Providers>
        )}
      </body>
    </html>
  );
}
