import "server-only";
import { randomUUID } from "node:crypto";
import { listStore, locked } from "./db";
import { authorizationKey, deleteBlob, putBlob } from "./blobs";
import type { MemberPublic } from "@/lib/members";
import type { Registration } from "@/lib/registration";

/**
 * Inscriptions, commandes et adhérentes : base de données (MySQL/MariaDB via DATABASE_URL) ou, en local, fichiers JSON dans .data/.
 * Chaque modification écrit uniquement la ligne concernée (jamais de remplacement de toute la liste).
 */
const regs = listStore<Registration>("registrations");
const ordersStore = listStore<Order>("orders");
const membersStore = listStore<StoredMember>("members");

const readAll = () => regs.read();

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
    await regs.upsert(created);
    return { ok: true, registration: created };
  });

export const updateRegistration = (id: string, patch: Partial<Registration>) =>
  locked(async () => {
    const cur = await regs.get(id);
    if (!cur) return null;
    const next = { ...cur, ...patch };
    await regs.upsert(next);
    return next;
  });

export const getRegistration = (id: string) => readAll().then((all) => all.find((r) => r.id === id) ?? null);

/* ---------- Commandes de la boutique ---------- */
import type { Order } from "@/lib/orders";

const readOrders = () => ordersStore.read();

export const addOrder = (o: Omit<Order, "id" | "token" | "createdAt">) =>
  locked(async () => {
    const year = new Date().getFullYear();
    const seq = (await readOrders()).filter((x) => x.orderNumber?.startsWith(`DDP-${year}-`)).length + 1;
    const created: Order = { ...o, id: randomUUID(), orderNumber: `DDP-${year}-${String(seq).padStart(5, "0")}`, token: randomUUID().replace(/-/g, ""), createdAt: new Date().toISOString() };
    await ordersStore.upsert(created);
    return created;
  });

export const updateOrder = (id: string, patch: Partial<Order>) =>
  locked(async () => {
    const cur = await ordersStore.get(id);
    if (!cur) return null;
    const next = { ...cur, ...patch };
    await ordersStore.upsert(next);
    return next;
  });

export const getOrder = (id: string) => readOrders().then((all) => all.find((o) => o.id === id) ?? null);

/* ---------- Membres (comptes, cartes, autorisations parentales) ---------- */

export type StoredMember = MemberPublic & { passwordHash: string; reset?: { hash: string; exp: number } };

const readMembers = () => membersStore.read();

export const toPublic = ({ passwordHash: _p, reset: _r, ...m }: StoredMember): MemberPublic => {
  void _p;
  void _r;
  return m;
};

export const normalizeEmail = (e: string) => e.trim().toLowerCase();

export type AddMemberResult = { ok: true; member: StoredMember } | { ok: false; reason: "duplicate" };

/** Écrit les PDF d'autorisation parentale (en base) puis crée la fiche, de façon atomique (numéro de membre unique, e-mail unique). */
export const addMember = (build: (taken: ReadonlySet<string>) => StoredMember, files: Array<{ id: string; bytes: Buffer }>, email: string, memberId: string) =>
  locked<AddMemberResult>(async () => {
    const all = await readMembers();
    if (all.some((m) => normalizeEmail(m.email) === normalizeEmail(email))) return { ok: false, reason: "duplicate" };
    const member = build(new Set(all.map((m) => m.memberNumber)));
    const written: string[] = [];
    try {
      for (const f of files) {
        await putBlob(authorizationKey(memberId, f.id), f.bytes, "application/pdf");
        written.push(f.id);
      }
      await membersStore.upsert(member);
    } catch (err) {
      await Promise.all(written.map((id) => deleteBlob(authorizationKey(memberId, id))));
      throw err;
    }
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
    const cur = await membersStore.get(id);
    if (!cur) return null;
    const next = { ...cur, ...patch };
    await membersStore.upsert(next);
    return next;
  });

export const getMemberById = (id: string) => membersStore.get(id);

/** Ajout d'une adhérente depuis le back-office (sans session ni pièces). */
export const addMemberRaw = (m: StoredMember) =>
  locked<AddMemberResult>(async () => {
    const all = await readMembers();
    if (all.some((x) => normalizeEmail(x.email) === normalizeEmail(m.email))) return { ok: false, reason: "duplicate" };
    await membersStore.upsert(m);
    return { ok: true, member: m };
  });

export const takenMemberNumbers = () => readMembers().then((all) => new Set(all.map((m) => m.memberNumber)));

/** Anonymise une fiche : conserve le numéro et les dates pour la comptabilité, efface les données personnelles et les pièces. */
export const anonymizeMember = (id: string) =>
  locked(async () => {
    const m = await membersStore.get(id);
    if (!m) return null;
    const next: StoredMember = {
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
    await membersStore.upsert(next);
    await Promise.all(m.authorizations.map((f) => deleteBlob(authorizationKey(m.id, f.id))));
    return next;
  });

export const deleteRegistrationById = (id: string) =>
  locked(async () => {
    return regs.remove(id);
  });

/** Inscription en liste d'attente (événement complet) : ne consomme aucune place. */
export const addWaitlistRegistration = (r: Omit<Registration, "id" | "createdAt">) =>
  locked(async () => {
    const all = await readAll();
    if (all.some((x) => x.eventId === r.eventId && x.memberNumber === r.memberNumber && holdsPlace(x))) return null;
    const created: Registration = { ...r, id: randomUUID(), createdAt: new Date().toISOString(), status: "waitlist" };
    await regs.upsert(created);
    return created;
  });

/**
 * Suppression définitive d'un PROFIL (compte créé sans carte payée) : fiche, pièces jointes, adhésions et paiements non réglés.
 * Les profils dont la carte est payée passent par l'effacement RGPD (les pièces comptables sont alors conservées).
 */
export const deleteMemberHard = (id: string) =>
  locked(async () => {
    const m = await membersStore.get(id);
    if (!m) return false;
    await Promise.all(m.authorizations.map((f) => deleteBlob(authorizationKey(m.id, f.id))));
    await membersStore.remove(id);
    return true;
  });
