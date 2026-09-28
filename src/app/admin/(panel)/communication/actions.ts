"use server";

import { redirect } from "next/navigation";
import { audit, requireAdmin } from "@/lib/server/admin-auth";
import { settings } from "@/lib/server/admin-store";
import { campaigns, templates } from "@/lib/server/content";
import { dispatchCampaign, recipientsFor } from "@/lib/server/comms";

const s = (f: FormData, k: string) => String(f.get(k) ?? "").trim();

export async function saveCampaignAction(formData: FormData) {
  const ctx = await requireAdmin("communication.send");
  const id = s(formData, "id");
  const audience = formData.getAll("audience").map(String);
  const subject = s(formData, "subject");
  const body = s(formData, "body");
  const back = id ? `/admin/communication/${id}` : "/admin/communication/nouvelle";
  if (!subject || !body) redirect(`${back}?erreur=${encodeURIComponent("Objet et contenu requis.")}`);
  if (audience.length === 0) redirect(`${back}?erreur=${encodeURIComponent("Choisissez au moins un groupe de destinataires.")}`);
  const scheduledAt = s(formData, "scheduledAt") ? new Date(s(formData, "scheduledAt")).toISOString() : undefined;
  // Photos (envoyées ou déjà enregistrées) et liens du message.
  const { saveMedia, mediaUrl } = await import("@/lib/server/media");
  const { safeUrl } = await import("@/lib/safe-url");
  const upload = async (file: FormDataEntryValue | null) => {
    if (!(file instanceof File) || file.size === 0) return "";
    const up = await saveMedia(file);
    if (!up.ok) redirect(`${back}?erreur=${encodeURIComponent(up.error)}`);
    if (!up.media.mime.startsWith("image/")) redirect(`${back}?erreur=${encodeURIComponent("Les photos d'une campagne doivent être des images.")}`);
    return mediaUrl(up.media);
  };
  const imageUrl = (await upload(formData.get("headerImageFile"))) || safeUrl(s(formData, "headerImage")) || undefined;
  const extraImages = formData.getAll("extraImages").map((v) => safeUrl(String(v))).filter(Boolean);
  for (const f of formData.getAll("extraImageFiles")) {
    const u = await upload(f);
    if (u) extraImages.push(u);
  }
  const links = s(formData, "links").split("\n").map((l) => l.split("|").map((x) => x.trim())).filter((p) => p[0] && p[1] && (/^https?:\/\//.test(p[1]) || p[1].startsWith("/"))).map(([label, url]) => ({ label: label.slice(0, 80), url }));
  const data = { imageUrl, imageAlt: s(formData, "imageAlt") || undefined, extraImages: extraImages.length ? extraImages : undefined, links: links.length ? links : undefined, subject, body, audience, buttonLabel: s(formData, "buttonLabel") || undefined, buttonUrl: s(formData, "buttonUrl") || undefined, scheduledAt, recipients: (await recipientsFor(audience)).length };
  let saved;
  if (id) {
    const before = await campaigns.get(id);
    if (before?.status === "sent") redirect(`${back}?erreur=${encodeURIComponent("Une campagne déjà envoyée ne peut plus être modifiée.")}`);
    saved = await campaigns.update(id, { ...data, status: scheduledAt ? "scheduled" : "draft" });
  } else saved = await campaigns.insert({ ...data, status: scheduledAt ? "scheduled" : "draft" });
  await audit(ctx, id ? "modification" : "création", "campagne", `Campagne ${id ? "modifiée" : "créée"} : ${subject}`, { entityId: saved?.id });
  redirect(`/admin/communication/${saved?.id}?ok=${encodeURIComponent(scheduledAt ? "Campagne programmée." : "Brouillon enregistré.")}`);
}

export async function sendCampaignAction(id: string) {
  const ctx = await requireAdmin("communication.send");
  const c = await campaigns.get(id);
  if (!c) redirect("/admin/communication");
  if (c.status === "sent") redirect(`/admin/communication/${id}?erreur=${encodeURIComponent("Déjà envoyée.")}`);
  const r = await dispatchCampaign(c);
  await audit(ctx, "envoi", "campagne", `Campagne « ${c.subject} » : ${r.queued ? "mise en file d'attente" : `${r.sent} envoi(s)`}`, { entityId: id });
  redirect(`/admin/communication/${id}?${r.queued ? "erreur" : "ok"}=${encodeURIComponent(r.queued ? "Aucun envoi : le service d'e-mail n'est pas configuré (ou a échoué). La campagne reste en file d'attente." : `${r.sent} e-mail(s) envoyé(s).`)}`);
}

export async function deleteCampaignAction(id: string) {
  const ctx = await requireAdmin("communication.send");
  await campaigns.remove(id);
  await audit(ctx, "suppression", "campagne", "Campagne supprimée", { entityId: id });
  redirect("/admin/communication?ok=" + encodeURIComponent("Campagne supprimée."));
}

export async function saveTemplateAction(formData: FormData) {
  const ctx = await requireAdmin("communication.send");
  const id = s(formData, "id");
  await templates.update(id, { subject: s(formData, "subject"), body: s(formData, "body") });
  await audit(ctx, "modification", "modèle d'e-mail", `Modèle modifié : ${id}`, { entityId: id });
  redirect("/admin/communication/modeles?ok=" + encodeURIComponent("Modèle enregistré."));
}

export async function saveAutomationsAction(formData: FormData) {
  const ctx = await requireAdmin("settings.edit");
  const current = (await settings.get()).automations;
  const next = Object.fromEntries(Object.keys(current).map((k) => [k, formData.get(k) === "on"])) as typeof current;
  await settings.set({ automations: next });
  await audit(ctx, "modification", "automatisations", "Automatisations mises à jour", { before: current, after: next });
  redirect("/admin/communication/automatisations?ok=" + encodeURIComponent("Automatisations enregistrées."));
}
