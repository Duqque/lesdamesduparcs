import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site-url";
import { getPublishedNews } from "@/lib/server/content";
import { getPublishedEvents } from "@/lib/server/events";
import { getPublicCatalog } from "@/lib/server/shop";
import { getPageState } from "@/lib/server/page-gate";

/** Pages publiques à proposer à Google. Les pages d'attente (/billetterie, /communaute) et les espaces privés en sont exclus. */
const PAGES: Array<{ path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] }> = [
  { path: "/", priority: 1, changeFrequency: "weekly" },
  { path: "/qui-sommes-nous", priority: 0.9, changeFrequency: "monthly" },
  { path: "/rejoindre-le-groupe", priority: 0.9, changeFrequency: "monthly" },
  { path: "/rejoindre-le-groupe/adhesion", priority: 0.8, changeFrequency: "monthly" },
  { path: "/evenements", priority: 0.8, changeFrequency: "weekly" },
  { path: "/actualites", priority: 0.8, changeFrequency: "weekly" },
  { path: "/boutique", priority: 0.7, changeFrequency: "weekly" },
  { path: "/contact", priority: 0.5, changeFrequency: "yearly" },
  { path: "/reglement", priority: 0.3, changeFrequency: "yearly" },
  { path: "/mentions-legales", priority: 0.2, changeFrequency: "yearly" },
  { path: "/politique-de-confidentialite", priority: 0.2, changeFrequency: "yearly" },
  { path: "/politique-de-cookies", priority: 0.2, changeFrequency: "yearly" },
  { path: "/conditions-generales-de-vente", priority: 0.2, changeFrequency: "yearly" },
];

// Régénéré au plus toutes les heures : les nouveaux articles et événements y apparaissent seuls.
export const revalidate = 3600;

/**
 * L'état choisi dans l'administration (en ligne, masquée, maintenance, bientôt disponible) s'applique à toute une rubrique : la
 * mise en page de /rejoindre-le-groupe, /evenements, /actualites… porte le contrôle (PageGate). Une sous-page n'est donc proposée
 * à Google que si sa rubrique est en ligne : sinon elle affiche l'écran « Bientôt disponible » ou « Maintenance ».
 */
const sectionOf = (path: string) => (path === "/" ? "/" : `/${path.split("/")[1]}`);

/** Date de dernière modification valide : jamais dans le futur (Google ignore ou signale ces dates). */
function lastMod(...dates: Array<string | undefined>) {
  const now = Date.now();
  const ok = dates.map((d) => (d ? Date.parse(d) : NaN)).filter((t) => Number.isFinite(t) && t <= now);
  return ok.length ? new Date(Math.max(...ok)) : undefined;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [news, events, catalog] = await Promise.all([getPublishedNews(), getPublishedEvents(), getPublicCatalog()]);
  const sections = [...new Set([...PAGES.map((p) => sectionOf(p.path)), "/actualites", "/evenements", "/boutique"])];
  const states = await Promise.all(sections.map(async (s) => [s, (await getPageState(s)).state] as const));
  const live = (path: string) => states.find(([s]) => s === sectionOf(path))?.[1] === "live";
  const url = (path: string) => `${SITE_URL}${path === "/" ? "" : path}`;
  return [
    ...PAGES.filter((p) => live(p.path)).map((p) => ({ url: url(p.path), changeFrequency: p.changeFrequency, priority: p.priority })),
    ...(live("/actualites") ? news.map((n) => ({ url: url(`/actualites/${n.id}`), lastModified: lastMod(n.date), changeFrequency: "monthly" as const, priority: 0.6 })) : []),
    ...(live("/evenements") ? events.map((e) => ({ url: url(`/evenements/${e.id}`), lastModified: lastMod(e.updatedAt, e.createdAt), changeFrequency: "weekly" as const, priority: 0.7 })) : []),
    ...(live("/boutique") ? catalog.products.map((p) => ({ url: url(`/boutique/${p.id}`), changeFrequency: "weekly" as const, priority: 0.5 })) : []),
  ];
}
