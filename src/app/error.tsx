"use client";

import { ErrorScreen } from "@/components/errors/ErrorScreen";
import { errorBySlug } from "@/data/errors";

/** Erreur imprévue dans une page (500). */
export default function GlobalRouteError({ error }: { error: Error & { digest?: string } }) {
  return <ErrorScreen page={errorBySlug("500")!} fetchPhoto digest={error.digest} />;
}
