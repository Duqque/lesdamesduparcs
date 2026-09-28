import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { ErrorScreen } from "./ErrorScreen";
import { errorBySlug } from "@/data/errors";
import { errorPhotoFor } from "@/lib/server/error-photos";
import { getPageState, isAdminPreview } from "@/lib/server/page-gate";


/**
 * Applique l'état choisi dans l'administration à une section du site : « masquée » (page introuvable), « maintenance » ou « bientôt
 * disponible » (écran dédié). Les administratrices connectées voient toujours la page, pour pouvoir la préparer.
 */
export async function PageGate({ path, children }: { path: string; children: ReactNode }) {
  const { state, message } = await getPageState(path);
  if (state === "live" || (await isAdminPreview())) return <>{children}</>;
  if (state === "hidden") notFound();
  const base = errorBySlug(state === "maintenance" ? "maintenance" : "bientot-disponible")!;
  return <ErrorScreen page={{ ...base, text: message?.trim() || base.text }} photo={await errorPhotoFor(base.slug)} />;
}
