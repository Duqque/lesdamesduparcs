import { Badge, PageHeader, Panel, TableWrap, Td, Th, type Tone } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/server/admin-auth";
import { admins, loginEvents, settings } from "@/lib/server/admin-store";
import { paymentConfigured } from "@/lib/server/helloasso";
import { sqlEnabled, sqlStats } from "@/lib/server/sql";

export const metadata = { title: "Configuration · Sécurité et base de données" };

const has = (k: string) => Boolean(process.env[k]?.trim());
const mb = (n: number) => `${(n / 1_048_576).toFixed(1).replace(".", ",")} Mo`;

interface Check {
  label: string;
  ok: boolean | "warn";
  detail: string;
}

export default async function SecurityStatusPage() {
  await requireAdmin("admins.manage");
  const db = sqlEnabled();
  const [stats, adminList, conf, events] = await Promise.all([
    db ? sqlStats().catch(() => null) : Promise.resolve(null),
    admins.all(),
    settings.get(),
    loginEvents.find((e) => !e.success && Date.now() - new Date(e.createdAt).getTime() < 86_400_000),
  ]);
  const prod = process.env.NODE_ENV === "production";
  const https = (process.env.NEXT_PUBLIC_SITE_URL ?? "").startsWith("https://");
  const noMfa = adminList.filter((a) => a.active && !a.totpEnabled).length;

  const checks: Check[] = [
    { label: "Base de données MySQL / MariaDB", ok: db && Boolean(stats), detail: db ? (stats ? `Connectée (${stats.version}). Toutes les données y sont enregistrées.` : "DATABASE_URL défini mais la base ne répond pas.") : prod ? "DATABASE_URL absent : les données sont sur des fichiers du serveur, non recommandé en production." : "Mode développement : fichiers locaux dans .data/." },
    { label: "Site en HTTPS", ok: https, detail: https ? "NEXT_PUBLIC_SITE_URL en https : cookies sécurisés, HSTS, liens de paiement." : "Renseignez NEXT_PUBLIC_SITE_URL avec l'adresse https:// du site." },
    { label: "Clé de session (AUTH_SECRET)", ok: has("AUTH_SECRET") ? true : "warn", detail: has("AUTH_SECRET") ? "Fournie par l'hébergement (hors base de données)." : "Générée automatiquement et conservée en base. Fournir AUTH_SECRET dans les variables d'environnement sépare la clé des données." },
    { label: "Double authentification obligatoire", ok: conf.security.require2fa !== false, detail: conf.security.require2fa !== false ? "Exigée pour toutes les administratrices." : "Désactivée : à réactiver dans Rôles et permissions." },
    { label: "Administratrices sans double authentification", ok: noMfa === 0, detail: noMfa === 0 ? "Aucune." : `${noMfa} compte(s) actif(s) sans 2FA (accès limité à « Mon compte » tant qu'elle n'est pas configurée).` },
    { label: "Paiement HelloAsso", ok: paymentConfigured() ? true : "warn", detail: paymentConfigured() ? "Identifiants renseignés." : "Identifiants HelloAsso absents : les paiements en ligne sont désactivés." },
    { label: "Notification HelloAsso protégée", ok: (process.env.HELLOASSO_WEBHOOK_SECRET?.length ?? 0) >= 16 ? true : "warn", detail: (process.env.HELLOASSO_WEBHOOK_SECRET?.length ?? 0) >= 16 ? (has("HELLOASSO_SIGNATURE_KEY") ? "Jeton secret + signature HMAC." : "Jeton secret ; ajouter HELLOASSO_SIGNATURE_KEY pour vérifier aussi la signature.") : "HELLOASSO_WEBHOOK_SECRET absent : seul le rapprochement au retour et planifié est actif." },
    { label: "Envoi d'e-mails", ok: has("RESEND_API_KEY") ? true : "warn", detail: has("RESEND_API_KEY") ? "Service d'e-mail configuré." : "RESEND_API_KEY absent : aucun e-mail ne part." },
    { label: "Tâches planifiées protégées", ok: has("CRON_SECRET") ? true : "warn", detail: has("CRON_SECRET") ? "Jeton CRON_SECRET défini." : "Sans CRON_SECRET, seul le déclenchement depuis l'administration fonctionne." },
    { label: "Tentatives de connexion échouées (24 h)", ok: events.length < 20 ? true : "warn", detail: `${events.length} tentative(s) échouée(s).` },
  ];
  const tone = (c: Check): Tone => (c.ok === true ? "green" : c.ok === "warn" ? "orange" : "red");

  return (
    <>
      <PageHeader title="Sécurité et base de données" subtitle="État de la protection du site et du stockage des données." />
      <Panel title="Contrôles" flush>
        <TableWrap>
          <thead><tr><Th>Contrôle</Th><Th>État</Th><Th>Détail</Th></tr></thead>
          <tbody>
            {checks.map((c) => (
              <tr key={c.label}>
                <Td className="text-white">{c.label}</Td>
                <Td><Badge tone={tone(c)}>{c.ok === true ? "OK" : c.ok === "warn" ? "À améliorer" : "À corriger"}</Badge></Td>
                <Td className="text-mist">{c.detail}</Td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      </Panel>
      {stats && (
        <Panel className="mt-4" title="Contenu de la base de données" flush>
          <div className="border-b border-line px-5 py-4 font-body text-[13.5px] text-mist">
            {stats.collections.reduce((n, c) => n + c.count, 0)} enregistrements · {stats.files.count} fichier(s) ({mb(stats.files.bytes)}). Activez les sauvegardes automatiques de la base chez votre hébergeur.
          </div>
          <TableWrap>
            <thead><tr><Th>Collection</Th><Th>Enregistrements</Th></tr></thead>
            <tbody>{stats.collections.map((c) => <tr key={c.name}><Td className="text-white">{c.name}</Td><Td className="tabular-nums">{c.count}</Td></tr>)}</tbody>
          </TableWrap>
        </Panel>
      )}
    </>
  );
}
