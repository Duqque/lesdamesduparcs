"use server";

import { psgMatches } from "@/lib/server/matches";
import { safeUrl } from "@/lib/safe-url";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ClubEvent, EventStatus, EventTag } from "@/types";
import { audit, requireAdmin, requireFresh } from "@/lib/server/admin-auth";
import { slugify } from "@/lib/server/content";
import { sendTemplate } from "@/lib/server/email";
import { promoteWaitlist } from "@/lib/server/event-ops";
import { eventsDb, getEventAdmin, type EventRow } from "@/lib/server/events";
import { getMemberByNumber, getMemberByToken, listAllRegistrations, updateRegistration } from "@/lib/server/store";
import { formatLongDate } from "@/lib/format";
import { safeReturn } from "@/lib/admin/params";
import { setTxStatus } from "@/lib/server/business";
import { mediaUrl, saveMedia } from "@/lib/server/media";
import { announceAfterSave } from "@/lib/server/notify";

const s = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
const lines = (v: string) => v.split("\n").map((x) => x.trim()).filter(Boolean);
const TAGS: EventTag[] = ["Programme", "Matchday", "Soirée", "Atelier", "Membres", "Déplacement"];
const refresh = (id?: string) => {
  revalidatePath("/evenements");
  revalidatePath("/");
  if (id) revalidatePath(`/evenements/${id}`);
  revalidatePath("/admin", "layout");
};

function parseEvent(f: FormData, id: string): Omit<EventRow, "createdAt" | "updatedAt"> {
  const mode = (s(f, "mode") || "form") as "form" | "external" | "closed";
  const tiers = lines(s(f, "tiers")).map((l) => {
    const [label, price] = l.split("|").map((x) => x.trim());
    return { label, priceCents: Math.round(parseFloat((price ?? "0").replace(",", ".").replace(/[^\d.]/g, "")) * 100) || 0 };
  });
  const price = s(f, "pricing") === "free" ? 0 : Math.round(parseFloat(s(f, "price").replace(",", ".")) * 100) || tiers[0]?.priceCents || 0;
  const membersOnly = f.get("membersOnly") === "on";
  const title = s(f, "title");
  const summary = s(f, "summary") || s(f, "subtitle");
  return {
    id,
    title,
    subtitle: s(f, "subtitle"),
    tag: (TAGS.includes(s(f, "tag") as EventTag) ? s(f, "tag") : "Programme") as EventTag,
    date: s(f, "date"),
    time: s(f, "time") || "20:00",
    endTime: s(f, "endTime") || "23:00",
    venue: s(f, "venue"),
    address: [s(f, "address"), s(f, "city")].filter(Boolean).join(", "),
    city: s(f, "city") || undefined,
    gps: s(f, "gps") || undefined,
    mapUrl: s(f, "mapUrl") || undefined,
    image: safeUrl(s(f, "image")) || "/images/parc-pelouse-tribunes.webp",
    imageAlt: s(f, "imageAlt") || title,
    gallery: lines(s(f, "gallery")),
    variant: "photo",
    access: mode === "closed" ? "Terminé" : membersOnly ? "Membres" : mode === "external" ? "Billetterie" : "Sur inscription",
    summary,
    registration: {
      mode,
      priceCents: price,
      capacity: Number(s(f, "capacity")) || 0,
      minCapacity: Number(s(f, "minCapacity")) || undefined,
      waitlist: f.get("waitlist") === "on",
      membersOnly,
      tiers: tiers.length ? tiers : undefined,
      paymentMode: (s(f, "paymentMode") || "online") as "online" | "onsite" | "manual" | "optional" | "none",
      paymentInstructions: s(f, "paymentInstructions") || undefined,
      guardianRequired: f.get("guardianRequired") === "on" || undefined,
      minAge: Number(s(f, "minAge")) || undefined,
      maxAge: Number(s(f, "maxAge")) || undefined,
      singlePlace: f.get("singlePlace") === "on" || undefined,
    },
    description: s(f, "description").split(/\n{2,}/).map((x) => x.trim()).filter(Boolean),
    program: lines(s(f, "program")).map((l) => {
      const [time, t, ...rest] = l.split("|").map((x) => x.trim());
      return { time: time ?? "", title: t ?? "", text: rest.join(" | ") };
    }),
    speakers: [],
    practical: lines(s(f, "practical")).map((l) => {
      const [label, ...rest] = l.split("|").map((x) => x.trim());
      return { label: label ?? "", value: rest.join(" | ") };
    }),
    href: mode === "external" ? safeUrl(s(f, "ticketUrl")) || "/billetterie" : `/evenements/${id}`,
    status: (s(f, "status") || "draft") as EventStatus,
    publishAt: s(f, "publishAt") ? new Date(s(f, "publishAt")).toISOString() : undefined,
  } as Omit<EventRow, "createdAt" | "updatedAt">;
}

const shift = (date: string, kind: string, i: number) => {
  const d = new Date(`${date}T12:00:00Z`);
  if (kind === "weekly") d.setUTCDate(d.getUTCDate() + 7 * i);
  else if (kind === "biweekly") d.setUTCDate(d.getUTCDate() + 14 * i);
  else if (kind === "monthly") d.setUTCMonth(d.getUTCMonth() + i);
  return d.toISOString().slice(0, 10);
};

export async function saveEventAction(formData: FormData) {
  const ctx = await requireAdmin("events.edit");
  const editing = s(formData, "id");
  const title = s(formData, "title");
  const date = s(formData, "date");
  // Photo envoyée depuis le formulaire : enregistrée dans la médiathèque (base de données) et utilisée comme image principale.
  const upload = formData.get("imageFile");
  if (upload instanceof File && upload.size > 0) {
    const up = await saveMedia(upload);
    if (!up.ok) redirect(`${editing ? `/admin/evenements/${editing}/modifier` : "/admin/evenements/nouveau"}?erreur=${encodeURIComponent(up.error)}`);
    formData.set("image", mediaUrl(up.media));
  }
  if (!title || !date || !s(formData, "venue")) redirect(`${editing ? `/admin/evenements/${editing}/modifier` : "/admin/evenements/nouveau"}?erreur=${encodeURIComponent("Titre, date et lieu sont requis.")}`);

  if (editing) {
    const before = await getEventAdmin(editing);
    const data = parseEvent(formData, editing);
    // Sans la permission « tarifs », les prix et modes de paiement existants sont conservés tels quels.
    if (!ctx.can("events.pricing") && before) data.registration = { ...data.registration, priceCents: before.registration.priceCents, tiers: before.registration.tiers, paymentMode: before.registration.paymentMode, paymentInstructions: before.registration.paymentInstructions };
    await eventsDb.update(editing, { ...data, origin: before?.origin } as Partial<EventRow>);
    announceAfterSave();
    if (before && ctx.can("events.pricing") && (before.registration.priceCents !== data.registration.priceCents || before.registration.paymentMode !== data.registration.paymentMode)) await audit(ctx, "tarification", "événement", `Tarif de « ${title} » : ${(before.registration.priceCents / 100).toFixed(2)} € (${before.registration.paymentMode ?? "online"}) → ${(data.registration.priceCents / 100).toFixed(2)} € (${data.registration.paymentMode})`, { entityId: editing, before: { priceCents: before.registration.priceCents, paymentMode: before.registration.paymentMode }, after: { priceCents: data.registration.priceCents, paymentMode: data.registration.paymentMode } });
    await audit(ctx, "modification", "événement", `Événement modifié : ${title}`, { entityId: editing, before: before && { date: before.date, status: before.status, capacity: before.registration.capacity }, after: { date: data.date, status: data.status, capacity: data.registration.capacity } });
    await linkMatch(editing, s(formData, "matchId"));
    refresh(editing);
    redirect(`/admin/evenements/${editing}?ok=${encodeURIComponent("Événement enregistré.")}`);
  }

  const repeat = s(formData, "repeat");
  const count = repeat && repeat !== "none" ? Math.min(Math.max(Number(s(formData, "repeatCount")) || 1, 1), 20) : 1;
  const base = slugify(title);
  let first = "";
  for (let i = 0; i < count; i++) {
    let id = i === 0 ? base : `${base}-${i + 1}`;
    while (await eventsDb.get(id)) id = `${id}-${Math.random().toString(36).slice(2, 5)}`;
    const data = parseEvent(formData, id);
    if (!ctx.can("events.pricing")) data.registration = { ...data.registration, priceCents: 0, tiers: undefined, paymentMode: "none", paymentInstructions: undefined };
    data.date = shift(date, repeat, i);
    await eventsDb.insert(data);
    announceAfterSave();
    await audit(ctx, "création", "événement", `Événement créé : ${title} (${data.date})`, { entityId: id });
    if (!first) first = id;
  }
  if (first) await linkMatch(first, s(formData, "matchId"));
  refresh();
  redirect(`/admin/evenements/${first}?ok=${encodeURIComponent(count > 1 ? `${count} événements créés.` : "Événement créé.")}`);
}

export async function setEventStatusAction(id: string, status: EventStatus) {
  const ctx = await requireAdmin("events.edit");
  const ev = await getEventAdmin(id);
  if (!ev) redirect("/admin/evenements");
  await eventsDb.update(id, { status });
  announceAfterSave();
  await audit(ctx, status === "published" ? "publication" : "modification", "événement", `Événement « ${ev.title} » : statut ${status}`, { entityId: id, before: ev.status, after: status });
  refresh(id);
  redirect(`/admin/evenements/${id}?ok=${encodeURIComponent("Statut mis à jour.")}`);
}

export async function deleteEventAction(id: string) {
  const ctx = await requireAdmin("events.edit");
  const ev = await getEventAdmin(id);
  if (!ev) redirect("/admin/evenements");
  const regs = (await listAllRegistrations()).filter((r) => r.eventId === id);
  if (regs.length) {
    await eventsDb.update(id, { status: "archived" });
    await audit(ctx, "archivage", "événement", `Événement archivé (inscriptions existantes) : ${ev.title}`, { entityId: id });
    refresh(id);
    redirect("/admin/evenements?ok=" + encodeURIComponent("L'événement a des inscriptions : il a été archivé plutôt que supprimé."));
  }
  await eventsDb.remove(id);
  await audit(ctx, "suppression", "événement", `Événement supprimé : ${ev.title}`, { entityId: id });
  refresh(id);
  redirect("/admin/evenements?ok=" + encodeURIComponent("Événement supprimé."));
}

type RegOp = "confirm" | "cancel" | "refund" | "paid" | "waitlist" | "promote" | "unpaid";

export async function registrationAction(eventId: string, regId: string, op: RegOp, returnToRaw: string) {
  const returnTo = safeReturn(returnToRaw, "/admin/evenements");
  const ctx = await requireAdmin(op === "paid" || op === "refund" ? "finance.edit" : "events.attendance");
  if (op === "refund") await requireFresh(ctx);
  const reg = (await listAllRegistrations()).find((r) => r.id === regId);
  if (!reg) redirect(returnTo);
  const map = { confirm: reg.amountCents > 0 ? "awaiting_payment" : "confirmed", cancel: "cancelled", refund: "refunded", paid: "paid", waitlist: "waitlist", promote: reg.amountCents > 0 ? "awaiting_payment" : "confirmed", unpaid: "awaiting_payment" } as const;
  if (op === "refund") {
    const res = await setTxStatus(`registration:${regId}`, "refunded");
    if (!res.ok) redirect(`${returnTo}${returnTo.includes("?") ? "&" : "?"}erreur=${encodeURIComponent(res.error)}`);
  } else await updateRegistration(regId, { status: map[op] });
  const ev = await getEventAdmin(eventId);
  await audit(ctx, op === "refund" ? "remboursement" : "inscription", "inscription", `${reg.firstName} ${reg.lastName} : ${ev?.title ?? eventId} → ${map[op]}`, { entityId: regId, before: reg.status, after: map[op] });
  if (op === "promote" || op === "confirm") await sendTemplate("event_confirmation", reg.email, { prenom: reg.firstName, objet: ev?.title ?? "", date: ev ? formatLongDate(ev.date) : "" }, "eventConfirmation");
  if (op === "cancel" || op === "refund" || op === "waitlist") await promoteWaitlist(eventId);
  revalidatePath("/admin", "layout");
  redirect(`${returnTo}${returnTo.includes("?") ? "&" : "?"}ok=${encodeURIComponent("Inscription mise à jour.")}`);
}

export async function attendanceAction(regId: string, value: "present" | "absent" | "reset", returnToRaw: string) {
  const returnTo = safeReturn(returnToRaw, "/admin/evenements");
  const ctx = await requireAdmin("events.attendance");
  await updateRegistration(regId, { attended: value === "present" ? true : value === "absent" ? false : null, attendedAt: value === "present" ? new Date().toISOString() : undefined });
  await audit(ctx, "présence", "inscription", `Présence : ${value}`, { entityId: regId });
  redirect(returnTo);
}

/** Pointage : numéro de membre, adresse de vérification lue sur le QR code de la carte, ou jeton. */
export async function checkinAction(eventId: string, formData: FormData) {
  const ctx = await requireAdmin("events.attendance");
  const raw = s(formData, "code");
  const back = `/admin/evenements/${eventId}?vue=presences`;
  if (!raw) redirect(`${back}&erreur=${encodeURIComponent("Scannez ou saisissez un code.")}`);
  const token = raw.split("/").filter(Boolean).pop() ?? raw;
  const member = (await getMemberByToken(token)) ?? (await getMemberByNumber(raw.toUpperCase())) ?? (await getMemberByNumber(token.toUpperCase()));
  if (!member) redirect(`${back}&erreur=${encodeURIComponent("Aucune adhérente ne correspond à ce code.")}`);
  const reg = (await listAllRegistrations()).find((r) => r.eventId === eventId && r.memberNumber === member.memberNumber && r.status !== "cancelled" && r.status !== "refunded");
  if (!reg) redirect(`${back}&erreur=${encodeURIComponent(`${member.firstName} ${member.lastName} n'est pas inscrite à cet événement.`)}`);
  await updateRegistration(reg.id, { attended: true, attendedAt: new Date().toISOString() });
  await audit(ctx, "présence", "inscription", `Pointage : ${member.firstName} ${member.lastName}`, { entityId: reg.id });
  redirect(`${back}&ok=${encodeURIComponent(`${member.firstName} ${member.lastName} : présence enregistrée.`)}`);
}

export type { ClubEvent };

/** Relie l'événement à un match du PSG (un seul match par événement) ; chaîne vide : supprime le lien. */
async function linkMatch(eventId: string, matchId: string) {
  for (const m of await psgMatches.find((x) => x.relatedEventId === eventId && x.id !== matchId)) await psgMatches.update(m.id, { relatedEventId: undefined });
  if (matchId) await psgMatches.update(matchId, { relatedEventId: eventId });
}
