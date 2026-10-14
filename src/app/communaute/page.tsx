import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/layout/PagePlaceholder";

// Page d'attente : pas de contenu à proposer dans Google tant qu'elle n'est pas prête.
export const metadata: Metadata = { title: "Communauté", robots: { index: false, follow: true } };

export default function Page() {
  return <PagePlaceholder title="Communauté" description="Rejoins les Dames du Parc : adhésion, membres et coulisses." />;
}
