import { json } from "@/lib/server/http";
import { errorPhotoMap } from "@/lib/server/error-photos";

/** Photos des pages d'erreur (pour l'écran d'erreur qui s'affiche côté navigateur). */
export async function GET() {
  return json(await errorPhotoMap());
}
