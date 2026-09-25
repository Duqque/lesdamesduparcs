import "server-only";
import type { Metadata } from "next";
import type { NavConfig } from "@/lib/nav-config";
import { settings } from "./admin-store";
import { siteConfig } from "./content";

export type { NavConfig };

export async function getNavConfig(): Promise<NavConfig> {
  const { navigation } = await siteConfig.get();
  return { hidden: navigation.hidden, labels: navigation.labels };
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
