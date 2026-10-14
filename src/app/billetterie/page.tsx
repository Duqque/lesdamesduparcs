import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/layout/PagePlaceholder";

// Page d'attente : pas de contenu à proposer dans Google tant qu'elle n'est pas prête.
export const metadata: Metadata = { title: "Billetterie", robots: { index: false, follow: true } };

export default function Page() {
  return <PagePlaceholder title="Billetterie" description="Réserve ta place au Parc des Princes avec le groupe." />;
}
