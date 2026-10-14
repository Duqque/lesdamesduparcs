import type { Metadata } from "next";
import { SITE_URL } from "./site-url";

/**
 * Image de partage (WhatsApp, Facebook, LinkedIn…) : passée par l'optimiseur d'images en 1200 px, car une photo envoyée
 * en pleine résolution (plusieurs Mo) n'est pas affichée en aperçu par WhatsApp. Adresse absolue, exigée par ces services.
 */
export function shareImage(src: string | undefined): string {
  if (!src) return `${SITE_URL}/og-image.jpg`;
  if (/^https?:\/\//.test(src)) return src;
  return `${SITE_URL}/_next/image?url=${encodeURIComponent(src)}&w=1200&q=75`;
}

/** Métadonnées de partage d'une page de contenu (article, événement, produit) : titre, texte et photo qui lui sont propres. */
export function shareMeta(opts: { path: string; title: string; description?: string; image?: string; type?: "article" | "website" }): Pick<Metadata, "openGraph" | "twitter"> {
  return {
    openGraph: {
      type: opts.type ?? "article",
      siteName: "Les Dames du Parc",
      locale: "fr_FR",
      url: opts.path,
      title: opts.title,
      description: opts.description,
      images: [{ url: shareImage(opts.image), width: 1200, alt: opts.title }],
    },
    // Sans image propre à X, il reprend celle de l'aperçu ci-dessus (la photo de la page).
    twitter: { card: "summary_large_image", title: opts.title, description: opts.description },
  };
}

/**
 * Date et heure d'un événement à Paris, au format ISO avec le bon décalage : +02:00 l'été, +01:00 l'hiver (un décalage
 * figé ferait afficher par Google une heure fausse la moitié de l'année). Sans heure, la date seule.
 */
export function parisDateTime(date: string, time?: string): string {
  if (!/^\d{2}:\d{2}$/.test(time ?? "")) return date;
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = time!.split(":").map(Number);
  // Décalage de Paris lu par Intl (gère les changements d'heure). L'heure saisie est une heure LOCALE : on l'estime d'abord
  // comme si c'était l'heure UTC, puis on relit le décalage à l'instant réel (exact même la nuit du changement d'heure).
  const offsetAt = (ms: number) => {
    const name = new Intl.DateTimeFormat("en-US", { timeZone: "Europe/Paris", timeZoneName: "longOffset" }).formatToParts(new Date(ms)).find((p) => p.type === "timeZoneName")?.value ?? "GMT+01:00";
    const sign = name.includes("-") ? -1 : 1;
    const [oh = 0, om = 0] = (name.replace(/GMT[+-]?/, "") || "0:0").split(":").map(Number);
    return { minutes: sign * (oh * 60 + om), text: name.replace("GMT", "") || "+00:00" };
  };
  const asUtc = Date.UTC(y, m - 1, d, hh, mm);
  const offset = offsetAt(asUtc - offsetAt(asUtc).minutes * 60_000).text;
  return `${date}T${time}:00${offset}`;
}

/** Données structurées schema.org, sérialisées sans risque d'injection (« < » échappé). */
export const jsonLd = (data: object) => ({ __html: JSON.stringify(data).replace(/</g, "\\u003c") });
