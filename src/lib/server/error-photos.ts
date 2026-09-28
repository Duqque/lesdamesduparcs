import "server-only";
import { ERROR_PAGES, errorBySlug } from "@/data/errors";
import { settings } from "./admin-store";

/** Photo d'une page d'erreur : celle choisie dans l'administration, sinon la photo d'origine. */
export async function errorPhotoFor(slug: string) {
  const custom = (await settings.get()).errorPhotos?.[slug];
  return custom || errorBySlug(slug)?.photo || ERROR_PAGES[0].photo;
}

export async function errorPhotoMap() {
  const custom = (await settings.get()).errorPhotos ?? {};
  return Object.fromEntries(ERROR_PAGES.map((e) => [e.slug, custom[e.slug] || e.photo]));
}
