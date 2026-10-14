import type { NextConfig } from "next";

const siteHost = (() => {
  try {
    return process.env.NEXT_PUBLIC_SITE_URL ? new URL(process.env.NEXT_PUBLIC_SITE_URL).host : null;
  } catch {
    return null;
  }
})();

const nextConfig: NextConfig = {
  /** N'annonce pas le framework dans les en-têtes de réponse. */
  poweredByHeader: false,
  productionBrowserSourceMaps: false,
  /** Sortie autonome (`node server.js`) uniquement si NEXT_OUTPUT=standalone ; sinon `npm start` (next start) fonctionne normalement. */
  output: process.env.NEXT_OUTPUT === "standalone" ? "standalone" : undefined,
  /** Images non optimisées si le binaire `sharp` de la machine de build n'est pas celui du serveur. */
  images: {
    unoptimized: process.env.NEXT_IMAGES_UNOPTIMIZED === "1",
    // Les photos de la médiathèque (/medias/…) passent par l'optimiseur : redimensionnées à la taille d'affichage et
    // converties en WebP, au lieu d'être envoyées en pleine résolution. Leur adresse n'a pas d'extension : un logo SVG
    // y est donc renvoyé tel quel (jamais exécuté : politique de sécurité stricte, téléchargement forcé hors <img>).
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'none'; style-src 'unsafe-inline'; sandbox;",
    // Les photos changent rarement : le résultat optimisé reste en cache une semaine.
    minimumCacheTTL: 604800,
    // Éco-conception : AVIF d'abord (environ 35 % plus léger que le WebP à qualité visuelle équivalente), WebP pour les
    // navigateurs qui ne le lisent pas. Largeurs proposées resserrées : les photos du site ne dépassent pas 1 800 px, et
    // chaque largeur en moins raccourcit le « srcset » répété sur chaque image de chaque page.
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 828, 1080, 1200, 1920, 2560],
    // 60 : photos de fond d'en-tête, assombries par un dégradé (HeroBackdrop) ; 75 : toutes les autres.
    qualities: [60, 75],
  },
  /** Envoi de fichiers depuis le back-office (médiathèque : 12 Mo par fichier). */
  experimental: { cpus: 1, serverActions: { bodySizeLimit: "26mb", ...(siteHost ? { allowedOrigins: [siteHost] } : {}) } },
  serverExternalPackages: ["mysql2"],
  /** Fichiers fixes (photos, logos, textures de l'intro, audio, polices) : gardés une semaine par le navigateur au lieu d'être redemandés à chaque page. */
  async headers() {
    return ["images", "logos", "icons", "loader", "audio", "fonts", "email"].map((dir) => ({
      source: `/${dir}/:path*`,
      headers: [{ key: "Cache-Control", value: "public, max-age=604800, stale-while-revalidate=86400" }],
    }));
  },
  async redirects() {
    return [
      { source: "/abonnement", destination: "/rejoindre-le-groupe", permanent: true },
      // Ancienne adresse de la page « Qui sommes-nous » (ex-« Le groupe »).
      { source: "/groupe", destination: "/qui-sommes-nous", permanent: true },
      // Anciennes sous-pages de « Le groupe », réunies depuis dans la page unique « Qui sommes-nous ».
      {
        source: "/groupe/:slug(lettre-d-introduction|notre-histoire|qui-sommes-nous|nos-valeurs|pourquoi-un-fan-club-feminin|ce-que-nous-voulons-construire)",
        destination: "/qui-sommes-nous",
        permanent: true,
      },
      // Anciens chapitres 07 à 10 et conclusion (page unique « Qui sommes-nous » depuis), sous leurs deux anciennes adresses.
      {
        source: "/:base(groupe|qui-sommes-nous)/:slug(la-voix-des-supportrices|notre-communaute-au-quotidien|en-dehors-des-jours-de-match|pourquoi-le-paris-saint-germain|conclusion)",
        destination: "/qui-sommes-nous",
        permanent: true,
      },
      { source: "/:base(groupe|qui-sommes-nous)/adhesion", destination: "/rejoindre-le-groupe/adhesion", permanent: true },
    ];
  },
};

export default nextConfig;
