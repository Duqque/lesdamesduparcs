import "server-only";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import type { Registration } from "@/lib/registration";

/**
 * Stockage local des inscriptions (fichier JSON dans .data/).
 * À remplacer par une base de données pour la production (le système de fichiers de nombreux hébergeurs est éphémère).
 */
const dir = path.join(process.cwd(), ".data");
const file = path.join(dir, "registrations.json");
let queue: Promise<unknown> = Promise.resolve();

async function readAll(): Promise<Registration[]> {
  try {
    return JSON.parse(await readFile(file, "utf8")) as Registration[];
  } catch {
    return [];
  }
}

async function writeAll(list: Registration[]) {
  await mkdir(dir, { recursive: true });
  const tmp = `${file}.${randomUUID()}.tmp`;
  await writeFile(tmp, JSON.stringify(list, null, 2), "utf8");
  await rename(tmp, file);
}

/** Sérialise les écritures pour éviter les pertes de mise à jour. */
function locked<T>(fn: () => Promise<T>): Promise<T> {
  const run = queue.then(fn, fn);
  queue = run.catch(() => undefined);
  return run;
}

export const listRegistrations = (eventId: string) => readAll().then((all) => all.filter((r) => r.eventId === eventId));

export const takenPlaces = (list: Registration[]) => list.reduce((n, r) => n + r.places, 0);

export type AddResult = { ok: true; registration: Registration } | { ok: false; reason: "duplicate" | "full"; remaining: number };

/** Ajout atomique : vérifie doublon et capacité dans la même section critique. */
export const addRegistration = (r: Omit<Registration, "id" | "createdAt">, capacity: number) =>
  locked<AddResult>(async () => {
    const all = await readAll();
    const forEvent = all.filter((x) => x.eventId === r.eventId);
    if (forEvent.some((x) => x.memberNumber === r.memberNumber)) return { ok: false, reason: "duplicate", remaining: 0 };
    const remaining = Math.max(capacity - takenPlaces(forEvent), 0);
    if (r.places > remaining) return { ok: false, reason: "full", remaining };
    const created: Registration = { ...r, id: randomUUID(), createdAt: new Date().toISOString() };
    await writeAll([...all, created]);
    return { ok: true, registration: created };
  });

export const updateRegistration = (id: string, patch: Partial<Registration>) =>
  locked(async () => {
    const all = await readAll();
    const i = all.findIndex((r) => r.id === id);
    if (i < 0) return null;
    all[i] = { ...all[i], ...patch };
    await writeAll(all);
    return all[i];
  });

export const getRegistration = (id: string) => readAll().then((all) => all.find((r) => r.id === id) ?? null);

/* ---------- Commandes de la boutique ---------- */
import type { Order } from "@/lib/orders";

const ordersFile = path.join(dir, "orders.json");

async function readOrders(): Promise<Order[]> {
  try {
    return JSON.parse(await readFile(ordersFile, "utf8")) as Order[];
  } catch {
    return [];
  }
}

async function writeOrders(list: Order[]) {
  await mkdir(dir, { recursive: true });
  const tmp = `${ordersFile}.${randomUUID()}.tmp`;
  await writeFile(tmp, JSON.stringify(list, null, 2), "utf8");
  await rename(tmp, ordersFile);
}

export const addOrder = (o: Omit<Order, "id" | "token" | "createdAt">) =>
  locked(async () => {
    const created: Order = { ...o, id: randomUUID(), token: randomUUID().replace(/-/g, ""), createdAt: new Date().toISOString() };
    await writeOrders([...(await readOrders()), created]);
    return created;
  });

export const updateOrder = (id: string, patch: Partial<Order>) =>
  locked(async () => {
    const all = await readOrders();
    const i = all.findIndex((o) => o.id === id);
    if (i < 0) return null;
    all[i] = { ...all[i], ...patch };
    await writeOrders(all);
    return all[i];
  });

export const getOrder = (id: string) => readOrders().then((all) => all.find((o) => o.id === id) ?? null);
