import type { ClubEvent } from "@/types";

const SITE = "https://www.lesdamesduparc.com";

/** Convertit une date/heure locale de Paris en instant UTC (gère l'heure d'été). */
function parisToUtc(date: string, time: string) {
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  const guess = Date.UTC(y, m - 1, d, hh, mm);
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Paris",
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(new Date(guess));
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  const asParis = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"));
  return new Date(guess - (asParis - guess));
}

const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
const escape = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");

function endInstant(e: ClubEvent) {
  const start = parisToUtc(e.date, e.time);
  const end = parisToUtc(e.date, e.endTime);
  // Fin après minuit : on ajoute un jour
  return end <= start ? new Date(end.getTime() + 86_400_000) : end;
}

function vevent(e: ClubEvent) {
  return [
    "BEGIN:VEVENT",
    `UID:${e.id}@lesdamesduparc.com`,
    `DTSTAMP:${stamp(new Date())}`,
    `DTSTART:${stamp(parisToUtc(e.date, e.time))}`,
    `DTEND:${stamp(endInstant(e))}`,
    `SUMMARY:${escape(e.title)}`,
    `LOCATION:${escape(`${e.venue}, ${e.address}`)}`,
    `DESCRIPTION:${escape(`${e.summary}\n${SITE}/evenements/${e.id}`)}`,
    `URL:${SITE}/evenements/${e.id}`,
    "END:VEVENT",
  ].join("\r\n");
}

export function buildIcs(list: ClubEvent[]) {
  return ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Les Dames du Parc//Agenda//FR", "CALSCALE:GREGORIAN", "X-WR-CALNAME:Les Dames du Parc", ...list.map(vevent), "END:VCALENDAR"].join("\r\n");
}

export const icsHeaders = (filename: string) => ({
  "Content-Type": "text/calendar; charset=utf-8",
  "Content-Disposition": `attachment; filename="${filename}"`,
});
