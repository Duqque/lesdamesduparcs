import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/layout/PagePlaceholder";

export const metadata: Metadata = { title: "Billetterie" };

export default function Page() {
  return <PagePlaceholder title="Billetterie" description="Réserve ta place au Parc des Princes avec le groupe." />;
}
