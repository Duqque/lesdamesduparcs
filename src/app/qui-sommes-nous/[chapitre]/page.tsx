import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ChapterShell } from "@/components/histoire/ChapterShell";
import { ChapterPhoto } from "@/components/histoire/ChapterPhoto";
import { chapterContent } from "@/components/histoire/registry";
import { chapters, getChapter } from "@/data/chapters";

// Les anciennes sous-pages réunies dans la page unique « Qui sommes-nous » (/qui-sommes-nous) renvoient vers elle : voir next.config.ts
// (redirects), pas ici — un redirect() dans une route à params dynamiques non pré-générée provoque une erreur de rendu statique.
// Plus aucun chapitre n'y est pré-généré (chapters est vide) : la route est donc entièrement dynamique, sinon notFound() plante
// pour les mêmes raisons.
export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return chapters.map((c) => ({ chapitre: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ chapitre: string }> }): Promise<Metadata> {
  const { chapitre } = await params;
  const chapter = getChapter(chapitre);
  if (!chapter) return {};
  return { title: chapter.title, description: chapter.sub };
}

export default async function ChapterPage({ params }: { params: Promise<{ chapitre: string }> }) {
  const { chapitre } = await params;
  const chapter = getChapter(chapitre);
  const content = chapterContent[chapitre];
  if (!chapter || !content) notFound();
  return (
    <ChapterShell chapter={chapter} art={<ChapterPhoto slug={chapitre} />}>
      {content.body}
    </ChapterShell>
  );
}
