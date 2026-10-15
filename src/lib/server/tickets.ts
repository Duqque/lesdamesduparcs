import "server-only";
import { randomInt } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import type { Registration } from "@/lib/registration";
import type { ClubEvent } from "@/types";
import { settings } from "./admin-store";
import { enqueueEmail, processEmailJobsSoon } from "./email-jobs";
import { getEventAdmin } from "./events";
import { siteOrigin } from "./http";
import { SITE_URL } from "@/lib/site-url";
import { psgMatches, toView } from "./matches";
import { readMedia } from "./media";
import { getMemberByNumber, getRegistration, listAllRegistrations, updateRegistration } from "./store";
import { TICKET_PHOTO_RATIO, buildTicketPdf } from "./ticket-pdf";

/** Une inscription donne droit à un billet dès qu'elle est confirmée ou payée. */
export const ticketValid = (r: Pick<Registration, "status">) => r.status === "confirmed" || r.status === "paid";

/** Code unique du billet : 12 chiffres (Code 128, jeu C), sans zéro initial. */
export async function ensureTicketCode(regId: string) {
  const reg = await getRegistration(regId);
  if (!reg) return null;
  if (reg.ticketCode) return reg.ticketCode;
  const taken = new Set((await listAllRegistrations()).map((r) => r.ticketCode).filter(Boolean));
  let code = "";
  do code = `${randomInt(1, 10)}${Array.from({ length: 11 }, () => randomInt(0, 10)).join("")}`;
  while (taken.has(code));
  await updateRegistration(regId, { ticketCode: code, ticketIssuedAt: new Date().toISOString() });
  return code;
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
  const event = await getEventAdmin(reg.eventId);
  await enqueueEmail({
    type: "EVENT_CONFIRMATION",
    recipient: reg.email,
    dedupeKey: `EVENT_CONFIRMATION:${reg.id}`,
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
    },
  });
  processEmailJobsSoon();
  return code;
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

/** Contrôle à l'entrée : retrouve l'inscription d'après le code-barres scanné. */
export async function findByTicketCode(code: string) {
  const clean = code.replace(/\D/g, "");
  if (clean.length !== 12) return null;
  return (await listAllRegistrations()).find((r) => r.ticketCode === clean) ?? null;
}
