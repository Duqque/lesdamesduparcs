import "server-only";
import { randomBytes } from "node:crypto";
import { collection, type Row } from "./db";
import { deleteBlob, authorizationKey } from "./blobs";
import { memberships, payments, getTransactions } from "./business";
import { emailLog } from "./content";
import { revokeMemberSessions } from "./session";
import { getMemberById, listAllRegistrations, listOrders, listStoredMembers, updateMember, updateOrder, updateRegistration, type StoredMember } from "./store";

/* ---------- Demandes d'exercice de droits (registre) ---------- */

export type PrivacyType = "acces" | "rectification" | "effacement" | "opposition" | "limitation" | "portabilite" | "image";
export type PrivacyStatus = "received" | "in_progress" | "done" | "refused";

export const PRIVACY_TYPE_LABEL: Record<PrivacyType, string> = {
  acces: "Accès à mes données",
  rectification: "Rectification",
  effacement: "Effacement (« droit à l'oubli »)",
  opposition: "Opposition à un traitement",
  limitation: "Limitation d'un traitement",
  portabilite: "Portabilité (copie exploitable)",
  image: "Retrait de mon image (photo, vidéo)",
};
export const PRIVACY_STATUS_LABEL: Record<PrivacyStatus, string> = { received: "Reçue", in_progress: "En cours", done: "Traitée", refused: "Refusée" };

export interface PrivacyRequest extends Row {
  type: PrivacyType;
  name: string;
  email: string;
  message: string;
  status: PrivacyStatus;
  /** Adresse e-mail confirmée par la personne (lien envoyé à l'adresse indiquée) */
  verified: boolean;
  tokenHash?: string;
  /** Échéance légale : un mois après réception */
  dueAt: string;
  handledBy?: string;
  note?: string;
  closedAt?: string;
}
export const privacyRequests = collection<PrivacyRequest>("privacy_requests");

const MONTH_MS = 30 * 86_400_000;
export const dueDate = (from = Date.now()) => new Date(from + MONTH_MS).toISOString();

/* ---------- Export des données d'une personne ---------- */

export async function buildMemberExport(memberId: string) {
  const stored = await getMemberById(memberId);
  if (!stored) return null;
  const { passwordHash: _p, token: _t, reset: _r, ...member } = stored;
  void _p;
  void _t;
  void _r;
  const [ms, txs, regs, orders, mails] = await Promise.all([
    memberships.find((m) => m.memberId === memberId),
    getTransactions(),
    listAllRegistrations(),
    listOrders(),
    emailLog.find((e) => e.to.toLowerCase() === stored.email.toLowerCase()),
  ]);
  const email = stored.email.toLowerCase();
  return {
    exporteLe: new Date().toISOString(),
    note: "Copie des données personnelles conservées par l'association (article 15 et 20 du RGPD). Les mots de passe ne sont jamais conservés en clair.",
    adherente: member,
    adhesions: ms,
    paiements: txs.filter((t) => t.memberNumber === stored.memberNumber),
    inscriptionsEvenements: regs.filter((r) => r.memberNumber === stored.memberNumber || r.email.toLowerCase() === email),
    commandes: orders
      .filter((o) => o.memberNumber === stored.memberNumber || o.contact.email.toLowerCase() === email)
      .map(({ token: _tk, checkoutId: _c, ...o }) => (void _tk, void _c, o)),
    emailsEnvoyes: mails.map((e) => ({ date: e.createdAt, objet: e.subject, type: e.kind })),
  };
}

/* ---------- Effacement ---------- */

export interface ErasureSummary {
  member: boolean;
  registrations: number;
  orders: number;
  payments: number;
  memberships: number;
  emails: number;
  files: number;
}

const anon = (id: string) => `anonyme-${id.slice(0, 8)}@anonyme.invalid`;

/**
 * Effacement complet d'une adhérente. Les données personnelles sont supprimées ou rendues anonymes partout ; seules les pièces
 * comptables (montants, dates, contenu des commandes) sont conservées, sans lien avec la personne (obligation légale de 10 ans).
 * Le numéro de membre, qui contient des lettres du nom et la date de naissance, est lui aussi remplacé par un pseudonyme.
 */
export async function eraseMemberData(memberId: string): Promise<ErasureSummary | null> {
  const m = await getMemberById(memberId);
  if (!m) return null;
  const oldNumber = m.memberNumber;
  const email = m.email.toLowerCase();
  const pseudo = `ANON-${m.id.slice(0, 8).toUpperCase()}`;
  const summary: ErasureSummary = { member: true, registrations: 0, orders: 0, payments: 0, memberships: 0, emails: 0, files: m.authorizations.length };

  await revokeMemberSessions(m.id);
  await Promise.all(m.authorizations.map((f) => deleteBlob(authorizationKey(m.id, f.id))));

  for (const r of await listAllRegistrations()) {
    if (r.memberNumber !== oldNumber && r.email.toLowerCase() !== email) continue;
    await updateRegistration(r.id, { memberNumber: pseudo, firstName: "Anonyme", lastName: "Anonyme", email: anon(r.id), phone: "", birthDate: undefined, guardian: undefined, emergency: { name: "", phone: "" }, allergies: undefined, comment: undefined });
    summary.registrations++;
  }
  for (const o of await listOrders()) {
    if (o.memberNumber !== oldNumber && o.contact.email.toLowerCase() !== email) continue;
    await updateOrder(o.id, { memberNumber: o.memberNumber ? pseudo : undefined, token: randomBytes(18).toString("base64url"), contact: { email: anon(o.id), firstName: "Anonyme", lastName: "Anonyme" }, delivery: { mode: o.delivery.mode }, note: undefined });
    summary.orders++;
  }
  for (const p of await payments.find((x) => x.memberNumber === oldNumber || (x.email ?? "").toLowerCase() === email)) {
    await payments.update(p.id, { memberNumber: pseudo, name: "Anonyme", email: undefined, note: undefined });
    summary.payments++;
  }
  for (const ms of await memberships.find((x) => x.memberId === m.id)) {
    await memberships.update(ms.id, { memberNumber: pseudo, status: ms.status === "active" ? "cancelled" : ms.status });
    summary.memberships++;
  }
  for (const e of await emailLog.find((x) => x.to.toLowerCase() === email)) {
    await emailLog.remove(e.id);
    summary.emails++;
  }

  const erased: StoredMember = {
    ...m,
    memberNumber: pseudo,
    token: randomBytes(18).toString("base64url"),
    firstName: "Adhérente",
    lastName: "anonymisée",
    email: anon(m.id),
    phone: "",
    birthDate: "1900-01-01",
    address: { line1: "", postalCode: "", city: "", country: "" },
    guardian: undefined,
    authorizations: [],
    notes: undefined,
    status: "anonymized",
    passwordHash: "",
    reset: undefined,
  };
  await updateMember(m.id, erased);
  return summary;
}

/** Effacement d'une personne sans compte (commande ou inscription « invité ») à partir de son adresse e-mail. */
export async function eraseByEmail(rawEmail: string): Promise<ErasureSummary> {
  const email = rawEmail.trim().toLowerCase();
  const summary: ErasureSummary = { member: false, registrations: 0, orders: 0, payments: 0, memberships: 0, emails: 0, files: 0 };
  for (const r of await listAllRegistrations()) {
    if (r.email.toLowerCase() !== email) continue;
    await updateRegistration(r.id, { firstName: "Anonyme", lastName: "Anonyme", email: anon(r.id), phone: "", birthDate: undefined, guardian: undefined, emergency: { name: "", phone: "" }, allergies: undefined, comment: undefined });
    summary.registrations++;
  }
  for (const o of await listOrders()) {
    if (o.contact.email.toLowerCase() !== email) continue;
    await updateOrder(o.id, { token: randomBytes(18).toString("base64url"), contact: { email: anon(o.id), firstName: "Anonyme", lastName: "Anonyme" }, delivery: { mode: o.delivery.mode }, note: undefined });
    summary.orders++;
  }
  for (const p of await payments.find((x) => (x.email ?? "").toLowerCase() === email)) {
    await payments.update(p.id, { name: "Anonyme", email: undefined, note: undefined });
    summary.payments++;
  }
  for (const e of await emailLog.find((x) => x.to.toLowerCase() === email)) {
    await emailLog.remove(e.id);
    summary.emails++;
  }
  return summary;
}

/* ---------- Recherche de toutes les données d'une personne (pour l'administration) ---------- */

export async function findPerson(query: string) {
  const q = query.trim().toLowerCase();
  if (q.length < 3) return null;
  const [members, regs, orders, pays, mails] = await Promise.all([listStoredMembers(), listAllRegistrations(), listOrders(), payments.all(), emailLog.all()]);
  const member = members.find((m) => m.status !== "anonymized" && (m.email.toLowerCase() === q || m.memberNumber.toLowerCase() === q)) ?? null;
  const email = (member?.email ?? q).toLowerCase();
  const number = member?.memberNumber;
  return {
    member,
    email,
    registrations: regs.filter((r) => r.email.toLowerCase() === email || (number && r.memberNumber === number)).length,
    orders: orders.filter((o) => o.contact.email.toLowerCase() === email || (number && o.memberNumber === number)).length,
    payments: pays.filter((p) => (p.email ?? "").toLowerCase() === email || (number && p.memberNumber === number)).length,
    emails: mails.filter((e) => e.to.toLowerCase() === email).length,
  };
}

/** Adhérentes sans activité depuis plus de `months` mois (dernière adhésion terminée) : candidates à l'effacement (limitation de la conservation). */
export async function inactiveMembers(months: number) {
  const limit = Date.now() - months * 30.4 * 86_400_000;
  const [members, ms] = await Promise.all([listStoredMembers(), memberships.all()]);
  return members
    .filter((m) => m.status !== "anonymized")
    .map((m) => {
      const last = ms.filter((x) => x.memberId === m.id).map((x) => new Date(x.endsAt).getTime()).sort((a, b) => b - a)[0] ?? new Date(m.validUntil).getTime();
      return { member: m, lastActivity: last };
    })
    .filter((x) => x.lastActivity < limit)
    .sort((a, b) => a.lastActivity - b.lastActivity);
}
