import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ErrorScreen } from "@/components/errors/ErrorScreen";
import { ERROR_PAGES, errorBySlug } from "@/data/errors";
import { errorPhotoFor } from "@/lib/server/error-photos";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const page = errorBySlug((await params).slug);
  return { title: page ? `${page.code} · ${page.title}` : "Erreur", robots: { index: false } };
}

export function generateStaticParams() {
  return ERROR_PAGES.map((e) => ({ slug: e.slug }));
}

/** Aperçu et adresse de chaque page d'erreur : /erreur/404, /erreur/500, /erreur/paiement, /erreur/maintenance… */
export default async function ErrorPageRoute({ params }: { params: Promise<{ slug: string }> }) {
  const page = errorBySlug((await params).slug);
  if (!page) notFound();
  return <ErrorScreen page={page} photo={await errorPhotoFor(page.slug)} />;
}
