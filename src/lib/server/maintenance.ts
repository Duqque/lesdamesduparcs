import "server-only";
import { adminSessions, loginEvents } from "./admin-store";
import { purgeMemberSessions } from "./session";
import { contactMessages, emailLog } from "./content";
import { privacyRequests } from "./privacy";

const DAY = 86_400_000;

/**
 * Entretien de la base : sessions expirées, historique de connexions (90 jours).
 * Le journal d'audit n'est jamais purgé ici : il est conservé et non modifiable depuis l'administration.
 */
export async function housekeeping() {
  const now = Date.now();
  await purgeMemberSessions();
  await adminSessions.mutate((rows) => rows.filter((s) => new Date(s.expiresAt).getTime() > now));
  await contactMessages.mutate((rows) => rows.filter((m) => now - new Date(m.createdAt).getTime() < 365 * DAY));
  await emailLog.mutate((rows) => rows.filter((e) => now - new Date(e.createdAt).getTime() < 365 * DAY));
  await privacyRequests.mutate((rows) => rows.filter((r) => !r.closedAt || now - new Date(r.closedAt).getTime() < 3 * 365 * DAY));
  await loginEvents.mutate((rows) => rows.filter((e) => now - new Date(e.createdAt).getTime() < 90 * DAY));
}
