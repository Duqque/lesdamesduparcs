import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/layout/PagePlaceholder";

export const metadata: Metadata = { title: "Actualités" };

export default function Page() {
  return <PagePlaceholder title="Actualités" description="Comptes rendus de matchs, portraits et vie du groupe." />;
}
