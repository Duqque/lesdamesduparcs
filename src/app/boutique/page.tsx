import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/layout/PagePlaceholder";

export const metadata: Metadata = { title: "Boutique" };

export default function Page() {
  return <PagePlaceholder title="Boutique" description="Écharpes, maillots et goodies pour afficher ton soutien." />;
}
