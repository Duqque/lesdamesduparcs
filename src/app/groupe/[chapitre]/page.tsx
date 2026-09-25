import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ChapterShell } from "@/components/histoire/ChapterShell";
import { chapterContent } from "@/components/histoire/registry";
import { chapters, getChapter } from "@/data/chapters";

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
    <ChapterShell chapter={chapter} art={content.art}>
      {content.body}
    </ChapterShell>
  );
}
