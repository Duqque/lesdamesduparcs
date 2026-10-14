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

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [news, events, catalog] = await Promise.all([getPublishedNews(), getPublishedEvents(), getPublicCatalog()]);
  // Une page masquée ou en maintenance depuis l'administration n'est pas proposée à Google.
  const live = await Promise.all(PAGES.map(async (p) => ((await getPageState(p.path)).state === "live" ? p : null)));
  const shopLive = (await getPageState("/boutique")).state === "live";
  return [
    ...live.filter((p): p is (typeof PAGES)[number] => p !== null).map((p) => ({ url: `${SITE_URL}${p.path === "/" ? "" : p.path}`, changeFrequency: p.changeFrequency, priority: p.priority })),
    ...news.map((n) => ({ url: `${SITE_URL}/actualites/${n.id}`, lastModified: n.date, changeFrequency: "monthly" as const, priority: 0.6 })),
    ...events.map((e) => ({ url: `${SITE_URL}/evenements/${e.id}`, lastModified: e.date, changeFrequency: "weekly" as const, priority: 0.7 })),
    ...(shopLive ? catalog.products.map((p) => ({ url: `${SITE_URL}/boutique/${p.id}`, changeFrequency: "weekly" as const, priority: 0.5 })) : []),
  ];
}
