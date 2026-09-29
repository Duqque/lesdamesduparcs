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
  images: { unoptimized: process.env.NEXT_IMAGES_UNOPTIMIZED === "1" },
  /** Envoi de fichiers depuis le back-office (médiathèque : 12 Mo par fichier). */
  experimental: { cpus: 1, serverActions: { bodySizeLimit: "26mb", ...(siteHost ? { allowedOrigins: [siteHost] } : {}) } },
  serverExternalPackages: ["mysql2"],
  async redirects() {
    return [
      { source: "/abonnement", destination: "/rejoindre-le-groupe", permanent: true },
      // Anciennes sous-pages de « Le groupe », réunies depuis dans la page unique « Qui sommes-nous » (/groupe).
      {
        source: "/groupe/:slug(lettre-d-introduction|notre-histoire|qui-sommes-nous|nos-valeurs|pourquoi-un-fan-club-feminin|ce-que-nous-voulons-construire)",
        destination: "/groupe",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
