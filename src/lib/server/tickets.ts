import "server-only";
import { randomInt } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import type { Registration } from "@/lib/registration";
import type { ClubEvent } from "@/types";
import { settings } from "./admin-store";
import { emailJobs, enqueueEmail, processEmailJobs, processEmailJobsSoon } from "./email-jobs";
import { getEventAdmin } from "./events";
import { siteOrigin } from "./http";
import { parisDateTime } from "@/lib/seo";
import { promoteWaitlist } from "./event-ops";
import { SITE_URL } from "@/lib/site-url";
import { psgMatches, toView } from "./matches";
import { readMedia } from "./media";
import { getMemberByNumber, getRegistration, listAllRegistrations, updateRegistration } from "./store";
import { TICKET_PHOTO_RATIO, buildTicketPdf } from "./ticket-pdf";

/** Un billet n'existe qu'une fois l'inscription payée (ou confirmée pour un événement gratuit) : jamais sans paiement. */
export const ticketValid = (r: Pick<Registration, "status" | "amountCents">) => r.status === "paid" || (r.status === "confirmed" && r.amountCents === 0);

/** Début de l'événement (instant réel, heure de Paris). */
export const eventStartMs = (e: Pick<ClubEvent, "date" | "time">) => new Date(parisDateTime(e.date, /^\d{2}:\d{2}$/.test(e.time ?? "") ? e.time : "00:00")).getTime();
/** Délai jusqu'auquel un billet annulé (déjà payé) peut être redemandé : 2 h avant le début. */
export const REACTIVATE_BEFORE_MS = 2 * 3600_000;

/**
 * Annulation du billet par la participante : billet invalidé (refusé à l'entrée, marqué annulé dans la liste des inscrits),
 * place remise en vente (et proposée à la liste d'attente). Un billet payé n'est pas remboursé ; il peut être redemandé
 * jusqu'à 2 h avant l'événement s'il reste de la place.
 */
export async function cancelTicketByMember(regId: string) {
  const reg = await getRegistration(regId);
  if (!reg || reg.status === "cancelled" || reg.status === "refunded") return null;
  const now = new Date().toISOString();
  await updateRegistration(regId, {
    status: "cancelled",
    cancelledAt: now,
    paidBeforeCancel: reg.status === "paid" ? true : undefined,
    ticketCode: undefined,
    revokedTicketCodes: [...(reg.revokedTicketCodes ?? []), ...(reg.ticketCode ? [{ code: reg.ticketCode, at: now, reason: "annulation" as const }] : [])],
  });
  await promoteWaitlist(reg.eventId);
  return { paid: reg.status === "paid" };
}

/** Billet annulé (déjà payé) : peut-il être redemandé maintenant ? */
export async function reactivationState(reg: Registration, event: Pick<ClubEvent, "date" | "time" | "registration">) {
  if (reg.status !== "cancelled" || !reg.paidBeforeCancel) return { possible: false as const, reason: "none" as const };
  const until = eventStartMs(event) - REACTIVATE_BEFORE_MS;
  if (Date.now() > until) return { possible: false as const, reason: "late" as const, until };
  const list = await listAllRegistrations();
  const taken = list.filter((r) => r.eventId === reg.eventId && (r.status === "paid" || r.status === "confirmed" || r.status === "awaiting_payment")).reduce((n, r) => n + r.places, 0);
  if (event.registration.capacity - taken < reg.places) return { possible: false as const, reason: "full" as const, until };
  return { possible: true as const, until };
}

/** Redemande d'un billet annulé mais déjà payé : nouveau billet (nouveau code) envoyé par e-mail, place reprise. */
export async function reactivateTicket(regId: string) {
  const reg = await getRegistration(regId);
  const event = reg ? await getEventAdmin(reg.eventId) : null;
  if (!reg || !event) return { ok: false as const, error: "Inscription introuvable." };
  const st = await reactivationState(reg, event);
  if (!st.possible) return { ok: false as const, error: st.reason === "late" ? "Il est trop tard : un billet annulé peut être redemandé jusqu'à 2 h avant l'événement." : st.reason === "full" ? "L'événement est complet : plus aucune place n'est disponible." : "Ce billet ne peut pas être redemandé." };
  await updateRegistration(regId, { status: "paid", paidBeforeCancel: undefined, cancelledAt: undefined });
  const code = await freshCode();
  await updateRegistration(regId, { ticketCode: code, ticketIssuedAt: new Date().toISOString() });
  const mail = await enqueueTicketEmail(regId, code, "reissued");
  return { ok: true as const, code, sent: mail?.status === "sent" };
}

/** Nouveau code à 12 chiffres (Code 128, jeu C), sans zéro initial, jamais attribué (billets actuels et annulés). */
async function freshCode() {
  const taken = new Set((await listAllRegistrations()).flatMap((r) => [r.ticketCode, ...(r.revokedTicketCodes ?? []).map((x) => x.code)]).filter(Boolean));
  let code = "";
  do code = `${randomInt(1, 10)}${Array.from({ length: 11 }, () => randomInt(0, 10)).join("")}`;
  while (taken.has(code));
  return code;
}

/** Code unique du billet, attribué une fois. */
export async function ensureTicketCode(regId: string) {
  const reg = await getRegistration(regId);
  if (!reg) return null;
  if (reg.ticketCode) return reg.ticketCode;
  const code = await freshCode();
  await updateRegistration(regId, { ticketCode: code, ticketIssuedAt: new Date().toISOString() });
  return code;
}

/**
 * Billet perdu : un nouveau code remplace l'ancien, qui est annulé (refusé à l'entrée), et le nouveau billet est envoyé par e-mail.
 */
export async function reissueTicket(regId: string) {
  const reg = await getRegistration(regId);
  if (!reg || !ticketValid(reg)) return null;
  const code = await freshCode();
  const now = new Date().toISOString();
  await updateRegistration(regId, {
    ticketCode: code,
    ticketIssuedAt: now,
    revokedTicketCodes: [...(reg.revokedTicketCodes ?? []), ...(reg.ticketCode ? [{ code: reg.ticketCode, at: now, reason: "perte" as const }] : [])],
  });
  const mail = await enqueueTicketEmail(regId, code, "reissued");
  return { code, previous: reg.ticketCode, sent: mail?.status === "sent", email: reg.email };
}

/** Itinéraire Google Maps : lien saisi, coordonnées GPS, ou adresse du lieu. */
export function mapsUrl(e: Pick<ClubEvent, "venue" | "address" | "city" | "gps" | "mapUrl">) {
  if (e.mapUrl && /^https:\/\//.test(e.mapUrl)) return e.mapUrl;
  const dest = e.gps?.trim() || [e.venue, e.address, e.city].filter((x) => x && !/communiqu/i.test(x)).join(", ");
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(dest)}`;
}

/**
 * Billet émis : code attribué, puis e-mail de confirmation (une seule fois par inscription) avec le billet PDF en pièce jointe.
 * À appeler dès qu'une inscription devient confirmée ou payée.
 */
export async function issueTicket(regId: string) {
  const reg = await getRegistration(regId);
  if (!reg || !ticketValid(reg)) return null;
  const code = await ensureTicketCode(regId);
  if (code) await enqueueTicketEmail(regId, code, "first");
  return code;
}

/** Renvoie le billet en cours par e-mail (même code), à la demande de l'équipe. */
export async function resendTicket(regId: string) {
  const reg = await getRegistration(regId);
  if (!reg || !ticketValid(reg)) return null;
  const code = await ensureTicketCode(regId);
  if (!code) return null;
  const mail = await enqueueTicketEmail(regId, code, "resent");
  return { code, sent: mail?.status === "sent", email: reg.email };
}

/**
 * Met en file l'e-mail du billet. « first » : confirmation d'inscription (une seule par inscription) ; « reissued » : nouveau billet
 * après une perte ; « resent » : renvoi du billet en cours par l'équipe. Les deux derniers partent tout de suite (état renvoyé).
 */
async function enqueueTicketEmail(regId: string, code: string, mode: "first" | "reissued" | "resent") {
  const reg = await getRegistration(regId);
  if (!reg) return null;
  const reissued = mode === "reissued";
  const event = await getEventAdmin(reg.eventId);
  const job = await enqueueEmail({
    type: "EVENT_CONFIRMATION",
    recipient: reg.email,
    // Une confirmation par inscription ; chaque billet réémis part dans son propre e-mail.
    dedupeKey: mode === "first" ? `EVENT_CONFIRMATION:${reg.id}` : mode === "reissued" ? `EVENT_CONFIRMATION:${reg.id}:${code}` : `EVENT_CONFIRMATION:${reg.id}:${code}:envoi-${Date.now()}`,
    memberNumber: reg.memberNumber,
    payload: {
      registrationId: reg.id,
      firstName: reg.firstName,
      eventTitle: event?.title ?? reg.eventId,
      date: event?.date ?? "",
      time: event?.time,
      venue: event?.venue ?? "",
      address: event?.address,
      city: event?.city,
      maps: event ? mapsUrl(event) : "",
      places: reg.places,
      amountCents: reg.status === "paid" ? reg.amountCents : 0,
      practical: event?.practical ?? [],
      ticketCode: code,
      reissued,
      resent: mode === "resent",
    },
  });
  if (mode === "first") {
    processEmailJobsSoon();
    return job;
  }
  // Envoi demandé par l'équipe : tenté immédiatement, pour pouvoir lui dire s'il est parti.
  await processEmailJobs(5);
  return job ? await emailJobs.findOne((j) => j.id === job.id) : null;
}

/* ---------- Images (photo de l'événement, logos) ---------- */

async function rawImage(src?: string | null): Promise<Buffer | null> {
  if (!src) return null;
  try {
    if (src.startsWith("/medias/")) return (await readMedia(src.slice("/medias/".length).split(/[?#]/)[0]))?.bytes ?? null;
    if (src.startsWith("/")) {
      const root = path.join(process.cwd(), "public");
      const file = path.normalize(path.join(root, decodeURIComponent(src.split(/[?#]/)[0])));
      if (!file.startsWith(root)) return null;
      return await readFile(file);
    }
    if (/^https:\/\//.test(src)) {
      const res = await fetch(src, { signal: AbortSignal.timeout(5000) });
      if (!res.ok) return null;
      const buf = Buffer.from(await res.arrayBuffer());
      return buf.length <= 5_000_000 ? buf : null;
    }
  } catch {
    return null;
  }
  return null;
}

async function sharp() {
  try {
    return (await import("sharp")).default;
  } catch {
    return null;
  }
}

async function photoJpg(src?: string | null) {
  const raw = await rawImage(src);
  const s = await sharp();
  if (!raw || !s) return null;
  try {
    return await s(raw).rotate().resize(1080, Math.round(1080 / TICKET_PHOTO_RATIO), { fit: "cover", position: "attention" }).flatten({ background: "#030919" }).jpeg({ quality: 78 }).toBuffer();
  } catch {
    return null;
  }
}

async function logoPng(src?: string | null) {
  const raw = await rawImage(src);
  const s = await sharp();
  if (!raw || !s) return null;
  try {
    return await s(raw, { density: 300 }).resize(240, 240, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
  } catch {
    return null;
  }
}

const STATUS: Record<string, string> = { paid: "Payé", confirmed: "Confirmé" };

/** Billet PDF d'une inscription (null si l'inscription n'est pas confirmée ou payée). */
export async function ticketPdfFor(regId: string) {
  const reg = await getRegistration(regId);
  if (!reg || !ticketValid(reg)) return null;
  const event = await getEventAdmin(reg.eventId);
  if (!event) return null;
  const code = reg.ticketCode ?? (await ensureTicketCode(reg.id));
  if (!code) return null;
  const [conf, member, origin, linked] = await Promise.all([
    settings.get(),
    getMemberByNumber(reg.memberNumber),
    // Hors requête (e-mail envoyé en tâche de fond), l'adresse publique du site sert de base au QR code.
    siteOrigin().catch(() => SITE_URL),
    psgMatches.find((m) => m.relatedEventId === event.id && !m.hidden).then((l) => l[0]),
  ]);
  const view = linked ? await toView(linked) : null;
  const [photo, homeLogo, awayLogo, competitionLogo] = await Promise.all([photoJpg(event.image), logoPng(view?.homeLogo), logoPng(view?.awayLogo), logoPng(view?.competitionLogo)]);
  const bytes = await buildTicketPdf({
    code,
    event: { title: event.title, summary: event.subtitle || event.summary, tag: event.tag, date: event.date, time: event.time, endTime: event.endTime, venue: event.venue, address: event.address, city: event.city, mapsUrl: mapsUrl(event) },
    match: view ? { home: view.homeTeam, away: view.awayTeam, competition: view.competition || undefined, homeLogo, awayLogo, competitionLogo, time: view.time } : undefined,
    photo,
    holder: { firstName: reg.firstName, lastName: reg.lastName, birthDate: member?.birthDate ?? reg.birthDate, memberNumber: reg.memberNumber, places: reg.places, amountCents: reg.amountCents, status: STATUS[reg.status] ?? reg.status },
    memberQr: member && origin ? `${origin}/verification/${member.token}` : undefined,
    cancellationPolicy: event.registration.cancellationPolicy,
    asso: conf.association,
    issuedAt: reg.ticketIssuedAt ?? new Date().toISOString(),
  });
  return { bytes, filename: `billet-${event.id}-${code}.pdf`, code };
}

/** Contrôle à l'entrée : retrouve l'inscription d'après le code-barres scanné (billet en cours ou billet annulé car remplacé). */
export async function findByTicketCode(code: string) {
  const clean = code.replace(/\D/g, "");
  if (clean.length !== 12) return null;
  const all = await listAllRegistrations();
  const current = all.find((r) => r.ticketCode === clean);
  if (current) return { reg: current, revokedAt: null as string | null, reason: undefined as string | undefined };
  for (const r of all) {
    const old = r.revokedTicketCodes?.find((x) => x.code === clean);
    if (old) return { reg: r, revokedAt: old.at, reason: old.reason };
  }
  return null;
}
