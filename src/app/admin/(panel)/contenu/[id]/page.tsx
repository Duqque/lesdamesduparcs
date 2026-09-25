import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { ArticleForm } from "@/components/admin/ArticleForm";
import { SubmitButton } from "@/components/admin/SubmitButton";
import { Flash, PageHeader, Panel, btn } from "@/components/admin/ui";
import { first, type SP } from "@/lib/admin/params";
import { requireAdmin } from "@/lib/server/admin-auth";
import { articlesDb } from "@/lib/server/content";
import { deleteArticleAction, setArticleStatusAction } from "../actions";

export const metadata = { title: "Modifier l'article" };

export default async function EditArticlePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<SP> }) {
  await requireAdmin("content.edit");
  const { id } = await params;
  const sp = await searchParams;
  const [article, all] = await Promise.all([articlesDb.get(id), articlesDb.all()]);
  if (!article) notFound();
  return (
    <>
      <PageHeader back={{ href: "/admin/contenu", label: "Articles" }} title={article.title} actions={article.status === "published" && <Link href={`/actualites/${id}`} className={btn.outline}><ExternalLink aria-hidden className="size-4" /> Voir sur le site</Link>} />
      <Flash ok={first(sp.ok)} error={first(sp.erreur)} />
      <ArticleForm article={article} categories={[...new Set(all.map((a) => a.category))]} />
      <Panel className="mt-4" title="Actions rapides">
        <div className="flex flex-wrap gap-2">
          {article.status !== "published" && <form action={setArticleStatusAction.bind(null, id, "published")}><SubmitButton>Publier maintenant</SubmitButton></form>}
          {article.status === "published" && <form action={setArticleStatusAction.bind(null, id, "draft")}><SubmitButton variant="outline">Repasser en brouillon</SubmitButton></form>}
          <form action={deleteArticleAction.bind(null, id)}><SubmitButton variant="danger" confirm="Supprimer définitivement cet article ?">Supprimer</SubmitButton></form>
        </div>
      </Panel>
    </>
  );
}
