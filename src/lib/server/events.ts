import "server-only";
import { events as seedEvents, pastEvents as seedPast, watchParties as seedWatchParties } from "@/data/events";
import type { ClubEvent } from "@/types";
import { collection, type Row } from "./db";
import { listAllRegistrations } from "./store";
import { auditLog, markMigrationDone, migrationDone } from "./admin-store";

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

/**
 * « billetterie-barca-2026-10 » : billetterie de la watch party PSG - Barça du 20/10/2026 (texte transmis par l'association) :
 * 10 € la place payée en ligne, 80 billets, un par personne, annulation possible par la participante sans remboursement.
 * Le match PSG - FC Barcelone du calendrier est relié à l'événement.
 */
const BARCA_TICKETING_2026_10 = "billetterie-barca-2026-10";
const BARCA_ID = "watch-party-fc-barcelone";
const BARCA_POLICY = "Tu peux annuler ta réservation si tu ne peux finalement plus participer. Toutefois, tout billet acheté est non remboursable : en cas d'annulation de ta part, aucun remboursement ne sera effectué.\n\nMerci de bien vérifier tes disponibilités avant de procéder au paiement.";

async function applyBarcaTicketing2026_10() {
  const ev = await eventsDb.get(BARCA_ID);
  if (ev) {
    const intro = "Viens vivre le match avec Les Dames du Parc et partager une soirée de football, de passion et de convivialité !";
    await eventsDb.update(BARCA_ID, {
      title: "Watch party : PSG - Barça",
      subtitle: intro,
      summary: "Tarif : 10 € par personne",
      access: "Billetterie · 10 €",
      description: ["Le billet comprend :\n• Une boisson\n• Un sandwich", "80 billets disponibles, limités à un billet par personne. Merci de bien vérifier tes disponibilités avant de procéder au paiement."],
      practical: [
        { label: "Tarif", value: "10 € par personne" },
        { label: "Le billet comprend", value: "Une boisson et un sandwich" },
        { label: "Places", value: "80 billets, 1 par personne" },
        { label: "Annulation", value: "Possible depuis cette page, billet non remboursable" },
      ],
      registration: { ...ev.registration, mode: "form", priceCents: 1000, capacity: 80, singlePlace: true, paymentMode: "online", tiers: undefined, selfCancel: true, cancellationPolicy: BARCA_POLICY },
      status: "published",
    });
  }
  // Import dynamique : matches.ts n'a pas à dépendre des événements au chargement.
  const { psgMatches } = await import("./matches");
  const match = (await psgMatches.all()).find((m) => m.date === "2026-10-20" && /barc/i.test(`${m.homeTeam} ${m.awayTeam}`));
  if (match && match.relatedEventId !== BARCA_ID) await psgMatches.update(match.id, { relatedEventId: BARCA_ID });
  await auditLog.insert({ actorId: "systeme", actorName: "Mise à jour du site", action: "modification", entity: "événement", label: `Billetterie de la watch party PSG - Barça ouverte (10 €, 80 billets, 1 par personne)${match ? ", reliée au match du 20/10" : ""}` });
}

/**
 * « billetteries-ouvertes-a-toutes-2026-10 » : les événements sont ouverts à toutes (un compte client suffit, l'adhésion n'est
 * plus exigée), et les billetteries des événements à venir sont mises « en attente » : l'équipe décide de leur ouverture
 * (et du nombre de places) pour chacun. La watch party PSG - Barça, déjà en vente, reste ouverte. Le modèle d'e-mail « Nouvel
 * événement » ne promet plus de priorité aux adhérentes.
 */
const OPEN_TO_ALL_2026_10 = "billetteries-ouvertes-a-toutes-2026-10";
async function applyOpenToAll2026_10() {
  const parisToday = new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Paris" }).format(new Date());
  const paused: string[] = [];
  for (const e of await eventsDb.all()) {
    const reg = { ...e.registration, membersOnly: undefined };
    if (e.date >= parisToday && e.id !== BARCA_ID && reg.mode === "form" && reg.salesState !== "open") {
      reg.salesState = "paused";
      paused.push(e.title);
    }
    await eventsDb.update(e.id, { registration: reg, ...(e.access === "Membres" ? { access: "Sur réservation" } : {}) });
  }
  const { templates } = await import("./content");
  const t = await templates.findOne((x) => x.key === "new_event");
  if (t && /priorit/i.test(t.body)) await templates.update(t.id, { body: t.body.replace(/\n*Les adhérentes actives ont la priorité sur les inscriptions\.?/g, "") });
  await auditLog.insert({ actorId: "systeme", actorName: "Mise à jour du site", action: "modification", entity: "événement", label: `Événements ouverts à toutes ; billetterie mise en attente : ${paused.join(", ") || "aucune"}` });
}

const MIGRATIONS: Array<[string, () => Promise<void>]> = [
  [WATCH_PARTIES_2026_10, applyWatchParties2026_10],
  [BARCA_TICKETING_2026_10, applyBarcaTicketing2026_10],
  [OPEN_TO_ALL_2026_10, applyOpenToAll2026_10],
];

async function ensureDataMigrations() {
  migrating ??= (async () => {
    for (const [name, run] of MIGRATIONS) {
      if (await migrationDone(name)) continue;
      await run();
      await markMigrationDone(name);
    }
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
