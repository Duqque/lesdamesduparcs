import { ErrorScreen } from "@/components/errors/ErrorScreen";
import { errorBySlug } from "@/data/errors";
import { errorPhotoFor } from "@/lib/server/error-photos";

/** Page introuvable (404). */
export default async function NotFound() {
  const page = errorBySlug("404")!;
  return <ErrorScreen page={page} photo={await errorPhotoFor("404")} />;
}
