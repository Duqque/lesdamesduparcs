import "server-only";
import { events as seedEvents, pastEvents as seedPast } from "@/data/events";
import type { ClubEvent } from "@/types";
import { collection, type Row } from "./db";

export type EventRow = ClubEvent & Row & { origin?: "seed" };

/** Événements : les contenus d'origine servent de base ; tout se gère ensuite depuis le back-office. */
export const eventsDb = collection<EventRow>("events", () =>
  [...seedEvents, ...seedPast].map((e) => ({ ...e, status: "published" as const, origin: "seed" as const })) as unknown as Array<Omit<EventRow, "createdAt" | "updatedAt">>,
);

const isLive = (e: ClubEvent, now = Date.now()) => e.status === "published" || (e.status === "scheduled" && e.publishAt !== undefined && new Date(e.publishAt).getTime() <= now) || e.status === undefined;

const byDate = (a: ClubEvent, b: ClubEvent) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`);
const today = () => new Date().toISOString().slice(0, 10);

/** Événements visibles sur le site public. */
export async function getPublishedEvents() {
  return (await eventsDb.all()).filter((e) => isLive(e)).sort(byDate);
}
export async function getUpcomingEvents() {
  return (await getPublishedEvents()).filter((e) => e.date >= today());
}
export async function getPastEvents() {
  return (await getPublishedEvents()).filter((e) => e.date < today()).reverse();
}
export async function getEvent(slug: string) {
  const e = await eventsDb.get(slug);
  return e && isLive(e) ? e : null;
}
export async function getAllEventsAdmin() {
  return (await eventsDb.all()).sort((a, b) => byDate(b, a));
}
export async function getEventAdmin(slug: string) {
  return eventsDb.get(slug);
}
