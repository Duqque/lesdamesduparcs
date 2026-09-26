"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { safeUrl } from "@/lib/safe-url";
import { DEFAULT_TICKET_URL, PARC, isPsg, opponentOf, parseCalendarText } from "@/lib/matches";
import { audit, requireAdmin } from "@/lib/server/admin-auth";
import { importMatches, logoKey, matchLogos, matchSettings, psgMatches, syncFromUrl } from "@/lib/server/matches";
import { deleteMedia, mediaUrl, saveMedia } from "@/lib/server/media";

const s = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
function back(m: { ok?: string; erreur?: string }, extra = ""): never {
  redirect(`/admin/evenements/matchs?${m.ok ? `ok=${encodeURIComponent(m.ok)}` : `erreur=${encodeURIComponent(m.erreur!)}`}${extra}`);
}
const refresh = () => {
  revalidatePath("/", "layout");
  revalidatePath("/evenements");
};

/** Logo carré : photo envoyée > adresse saisie. Renvoie "" si rien n'est fourni. Le cadre d'affichage est toujours carré (image ajustée sans déformation). */
async function logoFrom(formData: FormData, prefix: string): Promise<string> {
  const file = formData.get(`${prefix}File`);
  if (file instanceof File && file.size > 0) {
    const up = await saveMedia(file);
    if (!up.ok) back({ erreur: up.error });
    if (!up.media.mime.startsWith("image/")) {
      await deleteMedia(up.media.id);
      back({ erreur: "Un logo doit être une image (PNG, JPEG, WebP ou SVG)." });
    }
    return mediaUrl(up.media);
  }
  return safeUrl(s(formData, `${prefix}Url`));
}

/** Importe un calendrier : fichier ICS / tableau envoyé, ou texte collé (lignes copiées depuis Word ou Excel). */
export async function importCalendarAction(formData: FormData) {
  const ctx = await requireAdmin("events.edit");
  const file = formData.get("file");
  let text = s(formData, "text");
  if (file instanceof File && file.size > 0) {
    if (file.size > 2_000_000) back({ erreur: "Fichier trop volumineux (2 Mo maximum)." });
    text = await file.text();
  }
  if (!text) back({ erreur: "Choisissez un fichier ou collez le calendrier." });
  const parsed = parseCalendarText(text);
  if (!parsed.length) back({ erreur: "Aucun match du PSG reconnu. Formats acceptés : fichier ICS, ou lignes « date ; heure ; match ; compétition »." });
  const res = await importMatches(parsed, "calendrier");
  await audit(ctx, "import", "matchs du PSG", `Calendrier importé : ${res.total} match(s), ${res.added} ajouté(s), ${res.updated} mis à jour`);
  refresh();
  back({ ok: `${res.total} match(s) lus : ${res.added} ajouté(s), ${res.updated} mis à jour.` });
}

export async function saveMatchSettingsAction(formData: FormData) {
  const ctx = await requireAdmin("events.edit");
  const ticketUrl = safeUrl(s(formData, "ticketUrl")) || DEFAULT_TICKET_URL;
  const icsUrl = s(formData, "icsUrl");
  if (icsUrl && !/^https:\/\//i.test(icsUrl)) back({ erreur: "L'adresse du calendrier doit commencer par https://." });
  await matchSettings.set({ ticketUrl, icsUrl });
  await audit(ctx, "modification", "matchs du PSG", "Réglages des matchs modifiés (billetterie, calendrier automatique)");
  refresh();
  if (formData.get("syncNow") === "on" && icsUrl) {
    const r = await syncFromUrl(icsUrl);
    back(r.ok ? { ok: `Calendrier synchronisé : ${r.result.added} ajouté(s), ${r.result.updated} mis à jour, ${r.result.removed} retiré(s).` } : { erreur: r.error });
  }
  back({ ok: "Réglages enregistrés." });
}

export async function syncNowAction() {
  const ctx = await requireAdmin("events.edit");
  const r = await syncFromUrl();
  await audit(ctx, "import", "matchs du PSG", r.ok ? "Synchronisation du calendrier" : "Synchronisation du calendrier : échec");
  refresh();
  back(r.ok ? { ok: `Calendrier synchronisé : ${r.result.added} ajouté(s), ${r.result.updated} mis à jour, ${r.result.removed} retiré(s).` } : { erreur: r.error });
}

/** Création ou modification d'un match : équipes, compétition, billetterie, événement relié et logos (domicile, extérieur, compétition). */
export async function saveMatchAction(formData: FormData) {
  const ctx = await requireAdmin("events.edit");
  const id = s(formData, "id");
  const fail = (m: string) => back({ erreur: m }, id ? `&edit=${id}` : "");
  const date = s(formData, "date");
  const homeTeam = s(formData, "homeTeam");
  const awayTeam = s(formData, "awayTeam");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !homeTeam || !awayTeam) fail("Date, équipe à domicile et équipe à l'extérieur sont requises.");
  if (!isPsg(homeTeam) && !isPsg(awayTeam)) fail("Le PSG doit être l'une des deux équipes.");
  const time = /^\d{2}:\d{2}$/.test(s(formData, "time")) ? s(formData, "time") : "";
  const competition = s(formData, "competition").slice(0, 80);
  const ticket = safeUrl(s(formData, "ticketUrl"));

  // Logos : un logo enregistré pour un club ou une compétition sert ensuite à tous ses matchs.
  const [homeLogo, awayLogo, competitionLogo] = await Promise.all([logoFrom(formData, "homeLogo"), logoFrom(formData, "awayLogo"), logoFrom(formData, "competitionLogo")]);
  const lib = await matchLogos.get();
  const teams = { ...lib.teams };
  const competitions = { ...lib.competitions };
  if (homeLogo && !isPsg(homeTeam)) teams[logoKey(homeTeam)] = homeLogo;
  if (awayLogo && !isPsg(awayTeam)) teams[logoKey(awayTeam)] = awayLogo;
  if (competitionLogo && competition) competitions[logoKey(competition)] = competitionLogo;
  await matchLogos.set({ teams, competitions });

  const relatedEventId = s(formData, "relatedEventId") || undefined;
  const data = {
    date,
    time,
    homeTeam: isPsg(homeTeam) ? "Paris Saint-Germain" : homeTeam,
    awayTeam: isPsg(awayTeam) ? "Paris Saint-Germain" : awayTeam,
    competition,
    stadium: s(formData, "stadium") || (isPsg(homeTeam) ? PARC : ""),
    ticketUrl: ticket || undefined,
    relatedEventId,
    hidden: formData.get("hidden") === "on",
  };
  if (id) {
    const cur = await psgMatches.get(id);
    if (!cur) fail("Match introuvable.");
    await psgMatches.update(id, data);
    await audit(ctx, "modification", "match du PSG", `Match modifié : ${opponentOf(data)} (${date})`, { entityId: id });
  } else {
    const row = await psgMatches.insert({ ...data, source: "manuel" });
    await audit(ctx, "création", "match du PSG", `Match créé : ${opponentOf(data)} (${date})`, { entityId: row.id });
  }
  refresh();
  back({ ok: id ? "Match enregistré." : "Match créé." });
}

/** Enregistre en une fois les logos des clubs et des compétitions (bibliothèque). */
export async function saveLogoLibraryAction(formData: FormData) {
  const ctx = await requireAdmin("events.edit");
  const lib = await matchLogos.get();
  const teams = { ...lib.teams };
  const competitions = { ...lib.competitions };
  let n = 0;
  for (const kind of ["team", "comp"] as const) {
    for (const key of formData.getAll(`${kind}s`).map(String)) {
      const file = formData.get(`${kind}:${key}:file`);
      let logo = "";
      if (file instanceof File && file.size > 0) {
        const up = await saveMedia(file);
        if (!up.ok) back({ erreur: up.error });
        if (!up.media.mime.startsWith("image/")) {
          await deleteMedia(up.media.id);
          back({ erreur: "Un logo doit être une image." });
        }
        logo = mediaUrl(up.media);
      } else logo = safeUrl(s(formData, `${kind}:${key}:url`));
      if (!logo) continue;
      (kind === "team" ? teams : competitions)[key] = logo;
      n++;
    }
  }
  await matchLogos.set({ teams, competitions });
  await audit(ctx, "modification", "matchs du PSG", `${n} logo(s) de clubs ou de compétitions enregistré(s)`);
  refresh();
  back({ ok: n ? `${n} logo(s) enregistré(s).` : "Aucun nouveau logo." });
}

export async function deleteMatchAction(id: string) {
  const ctx = await requireAdmin("events.edit");
  await psgMatches.remove(id);
  await audit(ctx, "suppression", "match du PSG", "Match supprimé", { entityId: id });
  refresh();
  back({ ok: "Match supprimé." });
}
