import { ArticleForm } from "@/components/admin/ArticleForm";
import { Flash, PageHeader } from "@/components/admin/ui";
import { first, type SP } from "@/lib/admin/params";
import { requireAdmin } from "@/lib/server/admin-auth";
import { articlesDb } from "@/lib/server/content";

export const metadata = { title: "Nouvel article" };

export default async function NewArticlePage({ searchParams }: { searchParams: Promise<SP> }) {
  await requireAdmin("content.edit");
  const sp = await searchParams;
  const cats = [...new Set((await articlesDb.all()).map((a) => a.category))];
  return (
    <>
      <PageHeader back={{ href: "/admin/contenu", label: "Articles" }} title="Nouvel article" />
      <Flash error={first(sp.erreur)} />
      <ArticleForm categories={cats} />
    </>
  );
}
