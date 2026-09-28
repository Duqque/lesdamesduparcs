import "server-only";
import type { Metadata } from "next";
import type { NavConfig } from "@/lib/nav-config";
import { settings } from "./admin-store";
import { siteConfig } from "./content";
import { safeUrl } from "@/lib/safe-url";
import { DEFAULT_GROUP_PHOTOS, type GroupPhoto } from "@/lib/group-photos";

export type { NavConfig };

export async function getNavConfig(): Promise<NavConfig> {
  const { navigation } = await siteConfig.get();
  // Les pages « masquées » disparaissent aussi du menu : il se réorganise automatiquement.
  const { hiddenPagePaths, getPageState } = await import("./page-gate");
  // Tant que la boutique n'est pas en ligne, le bouton du panier disparaît aussi.
  const shop = await getPageState("/boutique");
  return { hidden: [...new Set([...navigation.hidden, ...(await hiddenPagePaths())])], labels: navigation.labels, hideCart: shop.state !== "live" };
}

/** Titre et description d'une page, avec les surcharges SEO saisies dans le back-office. */
export async function seoFor(path: string, defaults: { title: string; description?: string }): Promise<Metadata> {
  const { seo } = await siteConfig.get();
  const o = seo[path];
  return { title: o?.title || defaults.title, description: o?.description || defaults.description };
}

export async function siteMeta() {
  const s = await settings.get();
  return s.site;
}

/** Couleur d'accent personnalisée (hexadécimale stricte), sinon null. */
export async function accentOverride() {
  const { design } = await siteConfig.get();
  return /^#[0-9a-fA-F]{6}$/.test(design.accent) && design.accent.toLowerCase() !== "#d90f2c" ? design.accent : null;
}

/** Photos de « Le groupe » : valeurs par défaut, remplacées par celles choisies en administration. */
export async function getGroupPhotos(): Promise<Record<string, GroupPhoto>> {
  const { groupPhotos } = await siteConfig.get();
  const out: Record<string, GroupPhoto> = { ...DEFAULT_GROUP_PHOTOS };
  for (const [slug, p] of Object.entries(groupPhotos ?? {})) {
    if (out[slug] && safeUrl(p.src)) out[slug] = { src: p.src, alt: p.alt || out[slug].alt };
  }
  return out;
}
