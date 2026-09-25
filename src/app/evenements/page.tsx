import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/layout/PagePlaceholder";

export const metadata: Metadata = { title: "Événements" };

export default function Page() {
  return <PagePlaceholder title="Événements" description="Soirées, déplacements, tifos et rendez-vous des Dames du Parc." />;
}
