import "server-only";
import { cache } from "react";
import { siteConfig } from "./content";

/** Textes des pages : ceux saisis dans l'administration, sinon le texte d'origine. Lu une seule fois par requête. */
export const getCms = cache(async () => {
  const { cms } = await siteConfig.get();
  const t = (key: string, fallback: string) => (cms?.[key]?.trim() ? cms[key] : fallback);
  return { t };
});
