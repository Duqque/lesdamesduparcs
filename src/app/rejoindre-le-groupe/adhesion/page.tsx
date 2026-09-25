import type { Metadata } from "next";
import { seoFor } from "@/lib/server/site";
import { ChapterShell } from "@/components/histoire/ChapterShell";
import { chapterContent } from "@/components/histoire/registry";
import { adhesionChapter } from "@/data/chapters";

export async function generateMetadata(): Promise<Metadata> {
  return seoFor("/rejoindre-le-groupe/adhesion", { title: "Adhésion", description: "Une communauté ouverte à toutes les supportrices du PSG, et une adhésion pour celles qui souhaitent aller plus loin : principe, tarif, avantages, espace privé." });
}

export default function AdhesionPage() {
  const content = chapterContent.adhesion;
  return (
    <ChapterShell chapter={adhesionChapter} art={content.art} standalone={{ parentHref: "/rejoindre-le-groupe", parentLabel: "Rejoindre le groupe", eyebrow: "Adhésion" }}>
      {content.body}
    </ChapterShell>
  );
}
