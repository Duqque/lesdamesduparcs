import "server-only";
import { randomUUID } from "node:crypto";
import { DATA_DIR, listStore, locked } from "./db";
import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import type { MemberPublic } from "@/lib/members";
import type { Registration } from "@/lib/registration";

/**
 * Stockage local des inscriptions (fichier JSON dans .data/).
 * À remplacer par une base de données pour la production (le système de fichiers de nombreux hébergeurs est éphémère).
 */
const dir = DATA_DIR;
const regs = listStore<Registration>("registrations");
const ordersStore = listStore<Order>("orders");
const membersStore = listStore<StoredMember>("members");

const readAll = () => regs.read();
async function writeAll(list: Registration[]) {
  await regs.write(list, await regs.read());
}

export const listRegistrations = (eventId: string) => readAll().then((all) => all.filter((r) => r.eventId === eventId));

/** Places occupées : les inscriptions annulées, remboursées ou en liste d'attente ne comptent pas. */
const holdsPlace = (r: Registration) => r.status !== "cancelled" && r.status !== "refunded" && r.status !== "waitlist";
export const takenPlaces = (list: Registration[]) => list.filter(holdsPlace).reduce((n, r) => n + r.places, 0);

export type AddResult = { ok: true; registration: Registration } | { ok: false; reason: "duplicate" | "full"; remaining: number };

/** Ajout atomique : vérifie doublon et capacité dans la même section critique. */
export const addRegistration = (r: Omit<Registration, "id" | "createdAt">, capacity: number) =>
  locked<AddResult>(async () => {
    const all = await readAll();
    const forEvent = all.filter((x) => x.eventId === r.eventId);
    if (forEvent.some((x) => x.memberNumber === r.memberNumber && holdsPlace(x))) return { ok: false, reason: "duplicate", remaining: 0 };
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

const readOrders = () => ordersStore.read();
async function writeOrders(list: Order[]) {
  await ordersStore.write(list, await ordersStore.read());
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

/* ---------- Membres (comptes, cartes, autorisations parentales) ---------- */

export type StoredMember = MemberPublic & { passwordHash: string };

export const uploadsDir = (memberId: string) => path.join(dir, "uploads", memberId);
export const authorizationPath = (memberId: string, fileId: string) => path.join(uploadsDir(memberId), `${fileId}.pdf`);

const readMembers = () => membersStore.read();
async function writeMembers(list: StoredMember[]) {
  await membersStore.write(list, await membersStore.read());
}

export const toPublic = ({ passwordHash: _p, ...m }: StoredMember): MemberPublic => {
  void _p;
  return m;
};

export const normalizeEmail = (e: string) => e.trim().toLowerCase();

export type AddMemberResult = { ok: true; member: StoredMember } | { ok: false; reason: "duplicate" };

/** Écrit les PDF d'autorisation parentale puis crée la fiche, de façon atomique (numéro de membre unique, e-mail unique). */
export const addMember = (build: (taken: ReadonlySet<string>) => StoredMember, files: Array<{ id: string; bytes: Buffer }>, email: string, memberId: string) =>
  locked<AddMemberResult>(async () => {
    const all = await readMembers();
    if (all.some((m) => normalizeEmail(m.email) === normalizeEmail(email))) return { ok: false, reason: "duplicate" };
    const member = build(new Set(all.map((m) => m.memberNumber)));
    if (files.length) {
      await mkdir(uploadsDir(memberId), { recursive: true });
      try {
        for (const f of files) await writeFile(authorizationPath(memberId, f.id), f.bytes, { flag: "wx" });
      } catch (err) {
        await rm(uploadsDir(memberId), { recursive: true, force: true });
        throw err;
      }
    }
    await writeMembers([...all, member]);
    return { ok: true, member };
  });

export const listMembers = () => readMembers().then((all) => all.map(toPublic));
export const findMemberByLogin = (id: string) =>
  readMembers().then((all) => {
    const k = id.trim().toLowerCase();
    return all.find((m) => normalizeEmail(m.email) === k || m.memberNumber.toLowerCase() === k) ?? null;
  });
export const getMemberByNumber = (n: string) => readMembers().then((all) => all.find((m) => m.memberNumber === n) ?? null);
export const getMemberByToken = (t: string) => readMembers().then((all) => all.find((m) => m.token === t) ?? null);

export const listRegistrationsByMember = (memberNumber: string) => readAll().then((all) => all.filter((r) => r.memberNumber === memberNumber));
export const listOrdersByMember = (memberNumber: string) => readOrders().then((all) => all.filter((o) => o.memberNumber === memberNumber));

/* ---------- Accès complets pour le back-office ---------- */
export const listAllRegistrations = () => readAll();
export const listOrders = () => readOrders();
export const listStoredMembers = () => readMembers();

export const updateMember = (id: string, patch: Partial<StoredMember>) =>
  locked(async () => {
    const all = await readMembers();
    const i = all.findIndex((m) => m.id === id);
    if (i < 0) return null;
    all[i] = { ...all[i], ...patch };
    await writeMembers(all);
    return all[i];
  });

export const getMemberById = (id: string) => readMembers().then((all) => all.find((m) => m.id === id) ?? null);

/** Ajout d'une adhérente depuis le back-office (sans session ni pièces). */
export const addMemberRaw = (m: StoredMember) =>
  locked<AddMemberResult>(async () => {
    const all = await readMembers();
    if (all.some((x) => normalizeEmail(x.email) === normalizeEmail(m.email))) return { ok: false, reason: "duplicate" };
    await writeMembers([...all, m]);
    return { ok: true, member: m };
  });

export const takenMemberNumbers = () => readMembers().then((all) => new Set(all.map((m) => m.memberNumber)));

/** Anonymise une fiche : conserve le numéro et les dates pour la comptabilité, efface les données personnelles et les pièces. */
export const anonymizeMember = (id: string) =>
  locked(async () => {
    const all = await readMembers();
    const i = all.findIndex((m) => m.id === id);
    if (i < 0) return null;
    const m = all[i];
    all[i] = {
      ...m,
      firstName: "Adhérente",
      lastName: "anonymisée",
      email: `anonyme-${m.id.slice(0, 8)}@anonyme.invalid`,
      phone: "",
      birthDate: "1900-01-01",
      address: { line1: "", postalCode: "", city: "", country: "" },
      guardian: undefined,
      authorizations: [],
      notes: undefined,
      status: "anonymized",
      passwordHash: "",
    };
    await writeMembers(all);
    await rm(uploadsDir(m.id), { recursive: true, force: true });
    return all[i];
  });

export const deleteRegistrationById = (id: string) =>
  locked(async () => {
    const all = await readAll();
    const next = all.filter((r) => r.id !== id);
    if (next.length === all.length) return false;
    await writeAll(next);
    return true;
  });

/** Inscription en liste d'attente (événement complet) : ne consomme aucune place. */
export const addWaitlistRegistration = (r: Omit<Registration, "id" | "createdAt">) =>
  locked(async () => {
    const all = await readAll();
    if (all.some((x) => x.eventId === r.eventId && x.memberNumber === r.memberNumber && holdsPlace(x))) return null;
    const created: Registration = { ...r, id: randomUUID(), createdAt: new Date().toISOString(), status: "waitlist" };
    await writeAll([...all, created]);
    return created;
  });
