import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";
import { auditLog } from "./admin-store";
import { getPublishedEvents } from "./events";
import { listAllRegistrations, listStoredMembers, updateRegistration } from "./store";
import { ensureTicketCode, findByTicketCode, ticketValid } from "./tickets";

/**
 * API privée de l'application de contrôle des billets (application PHP « Contrôle DDP », installée à part).
 * Authentification par clé partagée : en-tête « Authorization: Bearer <SCANNER_API_KEY> » (variable d'environnement, 32 caractères
 * minimum). Sans clé configurée, l'API est fermée.
 */
export function scannerAuthorized(req: Request) {
  const key = process.env.SCANNER_API_KEY ?? "";
  if (key.length < 32) return false;
  const sent = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  const a = createHash("sha256").update(sent).digest();
  const b = createHash("sha256").update(key).digest();
  return sent.length > 0 && timingSafeEqual(a, b);
}

const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");
const parisToday = () => new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Paris" }).format(new Date());
const shift = (iso: string, days: number) => new Date(new Date(`${iso}T12:00:00Z`).getTime() + days * 86_400_000).toISOString().slice(0, 10);

/**
 * Billets des événements publiés d'hier à dans 90 jours : billets valides (code attribué au besoin), billets annulés, anciens codes
 * remplacés ou annulés (refusés à l'entrée), présence déjà relevée. L'empreinte du jeton de la carte de membre permet de
 * contrôler aussi par le QR code de la carte.
 */
export async function scannerSnapshot() {
  const today = parisToday();
  const events = (await getPublishedEvents()).filter((e) => e.date >= shift(today, -1) && e.date <= shift(today, 90));
  const ids = new Set(events.map((e) => e.id));
  const regs = (await listAllRegistrations()).filter((r) => ids.has(r.eventId));
  const members = new Map((await listStoredMembers()).map((m) => [m.memberNumber, m]));
  const tickets = [];
  const revoked = [];
  for (const r of regs) {
    const valid = ticketValid(r);
    const code = valid ? (r.ticketCode ?? (await ensureTicketCode(r.id))) : r.ticketCode;
    const m = members.get(r.memberNumber);
    if (code && (valid || r.status === "cancelled" || r.status === "refunded")) {
      tickets.push({
        id: r.id,
        event: r.eventId,
        code,
        status: valid ? "valid" : "cancelled",
        holder: `${r.firstName} ${r.lastName}`.trim(),
        birthDate: m?.birthDate ?? r.birthDate ?? null,
        memberNumber: r.memberNumber,
        member: m?.token ? sha256(m.token) : null,
        places: r.places,
        attended: r.attended === true,
        attendedAt: r.attendedAt ?? null,
      });
    }
    for (const old of r.revokedTicketCodes ?? []) revoked.push({ id: r.id, event: r.eventId, code: old.code, reason: old.reason ?? "perte", at: old.at, holder: `${r.firstName} ${r.lastName}`.trim() });
  }
  return {
    generatedAt: new Date().toISOString(),
    events: events.map((e) => ({ id: e.id, title: e.title, date: e.date, time: e.time, venue: e.venue, address: e.address, city: e.city ?? null })),
    tickets,
    revoked,
  };
}

/**
 * Présence relevée par l'application : billet en cours et valide → présente (heure du scan conservée). Idempotent : un billet déjà
 * pointé renvoie « already » avec l'heure du premier passage.
 */
export async function scannerCheckin(input: { code?: unknown; scannedAt?: unknown; controller?: unknown }) {
  const code = typeof input.code === "string" ? input.code.replace(/\D/g, "") : "";
  if (code.length !== 12) return { result: "unknown" as const };
  const found = await findByTicketCode(code);
  if (!found) return { result: "unknown" as const };
  const r = found.reg;
  if (found.revokedAt) return { result: "revoked" as const, reason: found.reason ?? "perte", at: found.revokedAt, id: r.id };
  if (!ticketValid(r)) return { result: "cancelled" as const, id: r.id };
  if (r.attended === true) return { result: "already" as const, attendedAt: r.attendedAt ?? null, id: r.id };
  const raw = typeof input.scannedAt === "string" ? Date.parse(input.scannedAt) : NaN;
  const at = Number.isFinite(raw) && Math.abs(Date.now() - raw) < 86_400_000 ? new Date(raw).toISOString() : new Date().toISOString();
  await updateRegistration(r.id, { attended: true, attendedAt: at });
  const who = typeof input.controller === "string" ? input.controller.slice(0, 60) : "application de contrôle";
  await auditLog.insert({ actorId: "scanner", actorName: `Contrôle des billets (${who})`, action: "présence", entity: "inscription", entityId: r.id, label: `Billet ${code} scanné à l'entrée : ${r.firstName} ${r.lastName}` });
  return { result: "present" as const, attendedAt: at, id: r.id };
}
