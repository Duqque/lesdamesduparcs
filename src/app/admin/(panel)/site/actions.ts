"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { HOME_SECTIONS } from "@/data/home-sections";
import { audit, requireAdmin } from "@/lib/server/admin-auth";
import { settings } from "@/lib/server/admin-store";
import { siteConfig } from "@/lib/server/content";
import { deleteMedia, replaceMedia, saveMedia } from "@/lib/server/media";
import { mediaDb } from "@/lib/server/content";

const s = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
const done = (path: string, msg: string) => redirect(`${path}?ok=${encodeURIComponent(msg)}`);
const refreshSite = () => {
  revalidatePath("/", "layout");
};

export async function saveHomeContentAction(formData: FormData) {
  const ctx = await requireAdmin("site.content");
  const before = (await siteConfig.get()).home;
  const home = {
    ...before,
    heroTitle: s(formData, "heroTitle"),
    heroSubtitle: s(formData, "heroSubtitle"),
    heroCta: s(formData, "heroCta"),
    featuredEventIds: formData.getAll("events").map(String).filter(Boolean),
    featuredArticleIds: formData.getAll("articles").map(String).filter(Boolean),
  };
  await siteConfig.set({ home });
  await audit(ctx, "modification", "accueil", "Contenu de la page d'accueil modifié", { before: { heroTitle: before.heroTitle, heroCta: before.heroCta }, after: { heroTitle: home.heroTitle, heroCta: home.heroCta } });
  refreshSite();
  done("/admin/site/accueil", "Page d'accueil enregistrée.");
}

export async function moveSectionAction(key: string, dir: "up" | "down") {
  const ctx = await requireAdmin("site.structure");
  const home = (await siteConfig.get()).home;
  const all = HOME_SECTIONS.map((x) => x.key as string);
  const order = [...home.sectionOrder.filter((k) => all.includes(k)), ...all.filter((k) => !home.sectionOrder.includes(k))];
  const i = order.indexOf(key);
  const j = dir === "up" ? i - 1 : i + 1;
  if (i >= 0 && j >= 0 && j < order.length) [order[i], order[j]] = [order[j], order[i]];
  await siteConfig.set({ home: { ...home, sectionOrder: order } });
  await audit(ctx, "modification", "sections", `Rubrique « ${key} » déplacée`, { after: order });
  refreshSite();
  redirect("/admin/site/sections");
}

export async function toggleSectionAction(key: string) {
  const ctx = await requireAdmin("site.structure");
  const home = (await siteConfig.get()).home;
  const hidden = home.hiddenSections.includes(key) ? home.hiddenSections.filter((k) => k !== key) : [...home.hiddenSections, key];
  await siteConfig.set({ home: { ...home, hiddenSections: hidden } });
  await audit(ctx, "modification", "sections", `Rubrique « ${key} » ${hidden.includes(key) ? "masquée" : "affichée"}`);
  refreshSite();
  redirect("/admin/site/sections");
}

export async function resetSectionsAction() {
  const ctx = await requireAdmin("site.structure");
  const home = (await siteConfig.get()).home;
  await siteConfig.set({ home: { ...home, sectionOrder: [], hiddenSections: [] } });
  await audit(ctx, "modification", "sections", "Rubriques de l'accueil réinitialisées");
  refreshSite();
  redirect("/admin/site/sections?ok=" + encodeURIComponent("Ordre par défaut rétabli."));
}

export async function saveNavigationAction(formData: FormData) {
  const ctx = await requireAdmin("site.structure");
  const hidden: string[] = [];
  const labels: Record<string, string> = {};
  for (const [k, v] of formData.entries()) {
    if (k.startsWith("label:") && typeof v === "string" && v.trim()) labels[k.slice(6)] = v.trim();
    if (k.startsWith("show:")) continue;
  }
  for (const [k] of formData.entries()) if (k.startsWith("hide:")) hidden.push(k.slice(5));
  await siteConfig.set({ navigation: { hidden, labels } });
  await audit(ctx, "modification", "navigation", "Navigation du site modifiée", { after: { hidden, labels } });
  refreshSite();
  done("/admin/site/navigation", "Navigation enregistrée.");
}

export async function saveSeoAction(formData: FormData) {
  const ctx = await requireAdmin("site.structure");
  const seo: Record<string, { title?: string; description?: string }> = {};
  for (const [k, v] of formData.entries()) {
    if (typeof v !== "string") continue;
    const m = k.match(/^(title|description):(.+)$/);
    if (m && v.trim()) seo[m[2]] = { ...seo[m[2]], [m[1]]: v.trim() };
  }
  await siteConfig.set({ seo });
  const site = { ...(await settings.get()).site, title: s(formData, "siteTitle") || "Les Dames du Parc", description: s(formData, "siteDescription"), favicon: s(formData, "favicon") };
  await settings.set({ site });
  await audit(ctx, "modification", "SEO", "Paramètres SEO modifiés", { after: { pages: Object.keys(seo).length, siteTitle: site.title } });
  refreshSite();
  done("/admin/site/seo", "Paramètres SEO enregistrés.");
}

export async function saveDesignAction(formData: FormData) {
  const ctx = await requireAdmin("site.structure");
  const accent = s(formData, "accent");
  if (!/^#[0-9a-fA-F]{6}$/.test(accent)) redirect("/admin/site/design?erreur=" + encodeURIComponent("Couleur invalide (format #rrggbb)."));
  const before = (await siteConfig.get()).design;
  await siteConfig.set({ design: { accent, note: s(formData, "note") } });
  const site = { ...(await settings.get()).site, footerText: s(formData, "footerText") };
  await settings.set({ site });
  await audit(ctx, "modification", "design", "Design du site modifié", { before: before.accent, after: accent });
  refreshSite();
  done("/admin/site/design", "Design enregistré.");
}

/* ---------- Médiathèque ---------- */

export async function uploadMediaAction(formData: FormData) {
  const ctx = await requireAdmin("media.manage");
  const files = formData.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length === 0) redirect("/admin/site/mediatheque?erreur=" + encodeURIComponent("Choisissez au moins un fichier."));
  let ok = 0;
  const errors: string[] = [];
  for (const f of files) {
    const r = await saveMedia(f);
    if (r.ok) ok++;
    else errors.push(r.error);
  }
  await audit(ctx, "création", "média", `${ok} fichier(s) ajouté(s) à la médiathèque`);
  redirect(`/admin/site/mediatheque?${errors.length ? `erreur=${encodeURIComponent(errors[0])}` : `ok=${encodeURIComponent(`${ok} fichier(s) ajouté(s).`)}`}`);
}

export async function renameMediaAction(id: string, formData: FormData) {
  const ctx = await requireAdmin("media.manage");
  const name = s(formData, "name");
  if (name) await mediaDb.update(id, { name: name.slice(0, 120) });
  await audit(ctx, "modification", "média", `Média renommé : ${name}`, { entityId: id });
  done("/admin/site/mediatheque", "Renommé.");
}

export async function deleteMediaAction(id: string) {
  const ctx = await requireAdmin("media.manage");
  await deleteMedia(id);
  await audit(ctx, "suppression", "média", "Média supprimé", { entityId: id });
  done("/admin/site/mediatheque", "Fichier supprimé.");
}

export async function replaceMediaAction(id: string, formData: FormData) {
  const ctx = await requireAdmin("media.manage");
  const f = formData.get("file");
  if (!(f instanceof File) || f.size === 0) redirect("/admin/site/mediatheque?erreur=" + encodeURIComponent("Choisissez le nouveau fichier."));
  const r = await replaceMedia(id, f);
  if (!r.ok) redirect("/admin/site/mediatheque?erreur=" + encodeURIComponent(r.error));
  await audit(ctx, "modification", "média", "Média remplacé (même adresse)", { entityId: id });
  revalidatePath("/", "layout");
  done("/admin/site/mediatheque", "Fichier remplacé : l'adresse reste la même partout où il est utilisé.");
}

