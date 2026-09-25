"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { audit, requireAdmin } from "@/lib/server/admin-auth";
import { articlesDb, slugify, type Article, type PublishStatus } from "@/lib/server/content";
import { mediaUrl, saveMedia } from "@/lib/server/media";

const s = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
const refresh = (id?: string) => {
  revalidatePath("/actualites");
  revalidatePath("/");
  if (id) revalidatePath(`/actualites/${id}`);
};

export async function saveArticleAction(formData: FormData) {
  const ctx = await requireAdmin("content.edit");
  const editing = s(formData, "id");
  const title = s(formData, "title");
  const fail = (m: string) => redirect(`${editing ? `/admin/contenu/${editing}` : "/admin/contenu/nouveau"}?erreur=${encodeURIComponent(m)}`);
  if (!title) fail("Le titre est requis.");

  let image = s(formData, "image");
  const file = formData.get("imageFile");
  if (file instanceof File && file.size > 0) {
    const up = await saveMedia(file);
    if (!up.ok) fail(up.error);
    else image = mediaUrl(up.media);
  }
  const status = (s(formData, "status") || "draft") as PublishStatus;
  const publishAt = s(formData, "publishAt") ? new Date(s(formData, "publishAt")).toISOString() : undefined;
  if (status === "scheduled" && !publishAt) fail("Indiquez la date de publication programmée.");
  const data = {
    title,
    summary: s(formData, "summary"),
    content: s(formData, "content"),
    image: image || "/images/parc-pelouse-tribunes.webp",
    imageAlt: s(formData, "imageAlt") || title,
    category: s(formData, "category") || "Actualité",
    tags: s(formData, "tags").split(",").map((t) => t.trim()).filter(Boolean),
    authorName: s(formData, "author") || `${ctx.admin.firstName} ${ctx.admin.lastName}`.trim(),
    status,
    publishAt,
    date: s(formData, "date") || new Date().toISOString().slice(0, 10),
    video: s(formData, "video") || undefined,
    gallery: s(formData, "gallery").split("\n").map((t) => t.trim()).filter(Boolean),
    seoTitle: s(formData, "seoTitle") || undefined,
    seoDescription: s(formData, "seoDescription") || undefined,
  };

  if (editing) {
    const before = await articlesDb.get(editing);
    await articlesDb.update(editing, data as Partial<Article>);
    await audit(ctx, status === "published" && before?.status !== "published" ? "publication" : "modification", "article", `Article ${status === "published" && before?.status !== "published" ? "publié" : "modifié"} : ${title}`, { entityId: editing, before: before && { title: before.title, status: before.status }, after: { title, status } });
    refresh(editing);
    redirect(`/admin/contenu/${editing}?ok=${encodeURIComponent("Article enregistré.")}`);
  }

  let id = slugify(s(formData, "slug") || title);
  while (await articlesDb.get(id)) id = `${id}-${Math.random().toString(36).slice(2, 5)}`;
  await articlesDb.insert({ id, views: 0, ...data } as never);
  await audit(ctx, status === "published" ? "publication" : "création", "article", `Article ${status === "published" ? "publié" : "créé"} : ${title}`, { entityId: id });
  refresh(id);
  redirect(`/admin/contenu/${id}?ok=${encodeURIComponent("Article créé.")}`);
}

export async function setArticleStatusAction(id: string, status: PublishStatus) {
  const ctx = await requireAdmin("content.edit");
  const a = await articlesDb.get(id);
  if (!a) redirect("/admin/contenu");
  await articlesDb.update(id, { status, publishAt: status === "published" ? undefined : a.publishAt });
  await audit(ctx, status === "published" ? "publication" : "modification", "article", `Article « ${a.title} » : statut ${status}`, { entityId: id, before: a.status, after: status });
  refresh(id);
  redirect(`/admin/contenu/${id}?ok=${encodeURIComponent("Statut mis à jour.")}`);
}

export async function deleteArticleAction(id: string) {
  const ctx = await requireAdmin("content.edit");
  const a = await articlesDb.get(id);
  await articlesDb.remove(id);
  await audit(ctx, "suppression", "article", `Article supprimé : ${a?.title ?? id}`, { entityId: id });
  refresh(id);
  redirect("/admin/contenu?ok=" + encodeURIComponent("Article supprimé."));
}

/** Renomme une catégorie (ou un tag) dans tous les articles. */
export async function renameTaxonomyAction(kind: "category" | "tag", formData: FormData) {
  const ctx = await requireAdmin("content.edit");
  const from = s(formData, "from");
  const to = s(formData, "to");
  const back = kind === "category" ? "/admin/contenu/categories" : "/admin/contenu/tags";
  if (!from || !to) redirect(`${back}?erreur=${encodeURIComponent("Indiquez le nouveau nom.")}`);
  await articlesDb.mutate((rows) => rows.map((a) => (kind === "category" ? (a.category === from ? { ...a, category: to } : a) : { ...a, tags: a.tags.map((t) => (t === from ? to : t)) })));
  await audit(ctx, "modification", kind === "category" ? "catégorie" : "tag", `« ${from} » renommé en « ${to} »`);
  refresh();
  redirect(`${back}?ok=${encodeURIComponent("Renommé.")}`);
}
