import "server-only";
import { events as seedEvents, pastEvents as seedPast, watchParties as seedWatchParties } from "@/data/events";
import type { ClubEvent } from "@/types";
import { collection, type Row } from "./db";
import { listAllRegistrations } from "./store";
import { auditLog, dataMigrations } from "./admin-store";

export type EventRow = ClubEvent & Row & { origin?: "seed" };

/** Événements : les contenus d'origine servent de base ; tout se gère ensuite depuis le back-office. */
export const eventsDb = collection<EventRow>("events", () =>
  [...seedEvents, ...seedWatchParties, ...seedPast].map((e) => ({ ...e, status: "published" as const, origin: "seed" as const })) as unknown as Array<Omit<EventRow, "createdAt" | "updatedAt">>,
);

const isLive = (e: ClubEvent, now = Date.now()) => e.status === "published" || (e.status === "scheduled" && e.publishAt !== undefined && new Date(e.publishAt).getTime() <= now) || e.status === undefined;

const byDate = (a: ClubEvent, b: ClubEvent) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`);
const today = () => new Date().toISOString().slice(0, 10);

/**
 * Mises à jour ponctuelles des données, appliquées une seule fois (repérées par leur nom) au premier accès aux événements.
 *
 * « calendrier-watch-parties-2026-10 » : calendrier « Watch_parties_PSG » transmis le 14/10/2026. Les événements à venir
 * déjà publiés sont retirés du site (archivés s'ils ont des inscriptions, comme depuis le back-office, sinon supprimés),
 * puis les soirées confirmées du document (src/data/events.ts, watchParties) sont publiées ou remises à jour.
 */
const WATCH_PARTIES_2026_10 = "calendrier-watch-parties-2026-10";
let migrating: Promise<void> | null = null;

async function applyWatchParties2026_10() {
  const parisToday = new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Paris" }).format(new Date());
  const confirmed = new Map(seedWatchParties.map((e) => [e.id, e]));
  const regs = await listAllRegistrations();
  const removed: string[] = [];
  for (const e of await eventsDb.all()) {
    if (confirmed.has(e.id) || e.date < parisToday || !isLive(e)) continue;
    if (regs.some((r) => r.eventId === e.id)) await eventsDb.update(e.id, { status: "archived" });
    else await eventsDb.remove(e.id);
    removed.push(e.title);
  }
  for (const w of seedWatchParties) {
    const current = await eventsDb.get(w.id);
    if (current) await eventsDb.update(w.id, { title: w.title, date: w.date, time: w.time, endTime: w.endTime, venue: w.venue, status: "published" });
    else await eventsDb.insert({ ...w, status: "published", origin: "seed" } as unknown as Omit<EventRow, "createdAt" | "updatedAt">);
  }
  await auditLog.insert({
    actorId: "systeme",
    actorName: "Mise à jour du site",
    action: "modification",
    entity: "événement",
    label: `Calendrier des watch parties appliqué : ${seedWatchParties.length} soirées confirmées publiées, ${removed.length} événement(s) à venir retiré(s)${removed.length ? ` (${removed.join(", ")})` : ""}`,
  });
}

async function ensureDataMigrations() {
  migrating ??= (async () => {
    const { done } = await dataMigrations.get();
    if (done.includes(WATCH_PARTIES_2026_10)) return;
    await applyWatchParties2026_10();
    await dataMigrations.set({ done: [...done, WATCH_PARTIES_2026_10] });
  })().catch((err) => {
    migrating = null; // nouvel essai au prochain accès
    console.error("[événements] mise à jour du calendrier impossible", err);
  });
  await migrating;
}

/** Événements visibles sur le site public. */
export async function getPublishedEvents() {
  await ensureDataMigrations();
  return (await eventsDb.all()).filter((e) => isLive(e)).sort(byDate);
}
export async function getUpcomingEvents() {
  return (await getPublishedEvents()).filter((e) => e.date >= today());
}
export async function getPastEvents() {
  return (await getPublishedEvents()).filter((e) => e.date < today()).reverse();
}
export async function getEvent(slug: string) {
  await ensureDataMigrations();
  const e = await eventsDb.get(slug);
  return e && isLive(e) ? e : null;
}
export async function getAllEventsAdmin() {
  await ensureDataMigrations();
  return (await eventsDb.all()).sort((a, b) => byDate(b, a));
}
export async function getEventAdmin(slug: string) {
  await ensureDataMigrations();
  return eventsDb.get(slug);
}
