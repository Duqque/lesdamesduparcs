import "server-only";
import { admins, adminSessions, auditLog, loginEvents, markMigrationDone, migrationDone } from "./admin-store";
import { ensureAuthSecret } from "./auth-secret";
import { collection, type Row } from "./db";
import { pseudoIp } from "./http";
import { listAllRegistrations, updateRegistration } from "./store";

/**
 * « rgpd-ip-pseudonymes-2026-10 » : les adresses IP déjà enregistrées (journal des connexions, journal d'activité, comptes
 * administrateurs, sessions) sont remplacées par leur empreinte chiffrée, et les allergies déjà saisies dans les inscriptions
 * (donnée de santé, plus demandée) sont effacées. Appliquée une seule fois, hors de tout verrou (rendu d'une page).
 */
const NAME = "rgpd-ip-pseudonymes-2026-10";
const IP_IN_TEXT = /\b(?:\d{1,3}\.){3}\d{1,3}\b|\b[0-9a-f]{0,4}(?::[0-9a-f]{0,4}){2,7}\b/gi;
let running: Promise<void> | null = null;

export function applyRgpdOnce() {
  running ??= (async () => {
    if (await migrationDone(NAME)) return;
    const secret = await ensureAuthSecret();
    const tag = (ip?: string) => (ip ? pseudoIp(ip, secret) : ip);
    for (const e of await loginEvents.all()) if (e.ip && !e.ip.startsWith("ip~")) await loginEvents.update(e.id, { ip: tag(e.ip)! });
    for (const e of await auditLog.all()) {
      const label = e.label.replace(IP_IN_TEXT, (m) => (m.includes(".") || m.includes("::") || m.split(":").length >= 5 ? "adresse masquée" : m)).replace("Connexion depuis une nouvelle adresse (adresse masquée)", "Connexion depuis un nouvel appareil ou réseau");
      if ((e.ip && !e.ip.startsWith("ip~")) || label !== e.label) await auditLog.update(e.id, { ip: tag(e.ip), label });
    }
    for (const a of await admins.all()) {
      if ((a.lastLoginIp && !a.lastLoginIp.startsWith("ip~")) || a.knownIps.some((x) => !x.startsWith("ip~")))
        await admins.update(a.id, { lastLoginIp: tag(a.lastLoginIp), knownIps: [...new Set(a.knownIps.map((x) => tag(x)!))] });
    }
    for (const s of await adminSessions.all()) if (s.ip && !s.ip.startsWith("ip~")) await adminSessions.update(s.id, { ip: tag(s.ip)! });
    const memberSessions = collection<Row & { ip: string }>("member_sessions");
    for (const s of await memberSessions.all()) if (s.ip && !s.ip.startsWith("ip~")) await memberSessions.update(s.id, { ip: tag(s.ip)! });
    for (const r of await listAllRegistrations()) if (r.allergies) await updateRegistration(r.id, { allergies: undefined });
    await markMigrationDone(NAME);
  })().catch((err) => {
    running = null;
    console.error("[rgpd] pseudonymisation des adresses IP impossible", err);
  });
  return running;
}
