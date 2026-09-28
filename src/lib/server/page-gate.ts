import "server-only";
import { cache } from "react";
import { getAdmin } from "./admin-auth";
import { siteConfig } from "./content";

export type PageStateName = "live" | "hidden" | "maintenance" | "soon";

type Stored = Record<string, { state: PageStateName; message?: string }>;

/** États d'origine : la boutique n'est pas encore ouverte (« Notre boutique arrive bientôt »), les autres pages sont en ligne. */
export const DEFAULT_PAGE_STATES: Stored = { "/boutique": { state: "soon", message: "Notre boutique arrive bientôt." } };

/** États enregistrés dans l'administration par-dessus les états d'origine (une page passée « en ligne » est enregistrée comme telle). */
export async function pageStatesOf(): Promise<Stored> {
  const { pageStates } = await siteConfig.get();
  return { ...DEFAULT_PAGE_STATES, ...(pageStates ?? {}) };
}

/** État d'une page : par défaut « en ligne ». */
export const getPageState = cache(async (path: string) => {
  const s = (await pageStatesOf())[path];
  return { state: (s?.state ?? "live") as PageStateName, message: s?.message };
});

/** Pages dont l'état est « masquée » : retirées des menus (le menu se réorganise automatiquement). */
export async function hiddenPagePaths() {
  return Object.entries(await pageStatesOf()).filter(([, v]) => v.state === "hidden").map(([k]) => k);
}

/** Les administratrices connectées voient toujours les pages (aperçu), même masquées ou en maintenance. */
export async function isAdminPreview() {
  try {
    const a = await getAdmin();
    return Boolean(a && (a.can("site.content") || a.can("site.structure")));
  } catch {
    return false;
  }
}
