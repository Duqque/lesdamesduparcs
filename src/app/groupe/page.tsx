import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/layout/PagePlaceholder";

export const metadata: Metadata = { title: "Le groupe" };

export default function Page() {
  return <PagePlaceholder title="Le groupe" description="Qui sommes-nous, notre histoire, nos valeurs et notre bureau." />;
}
