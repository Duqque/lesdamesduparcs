import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/layout/PagePlaceholder";

export const metadata: Metadata = { title: "Communauté" };

export default function Page() {
  return <PagePlaceholder title="Communauté" description="Rejoins les Dames du Parc : adhésion, membres et coulisses." />;
}
