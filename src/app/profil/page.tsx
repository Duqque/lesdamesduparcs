import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/layout/PagePlaceholder";

export const metadata: Metadata = { title: "Mon profil" };

export default function Page() {
  return <PagePlaceholder title="Mon profil" description="Ta carte membre, tes billets, tes avantages et ton équipe." />;
}
