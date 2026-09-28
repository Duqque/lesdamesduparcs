import "server-only";
import { cache } from "react";
import { getAdmin } from "./admin-auth";
import { siteConfig } from "./content";

export type PageStateName = "live" | "hidden" | "maintenance" | "soon";

/** État d'une page : par défaut « en ligne ». */
export const getPageState = cache(async (path: string) => {
  const { pageStates } = await siteConfig.get();
  const s = pageStates?.[path];
  return { state: (s?.state ?? "live") as PageStateName, message: s?.message };
});

/** Pages dont l'état est « masquée » : retirées des menus (le menu se réorganise automatiquement). */
export async function hiddenPagePaths() {
  const { pageStates } = await siteConfig.get();
  return Object.entries(pageStates ?? {}).filter(([, v]) => v.state === "hidden").map(([k]) => k);
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
