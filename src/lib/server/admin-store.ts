import "server-only";
import { association as assoDefaults } from "@/data/association";
import type { Role } from "@/lib/admin/permissions";
import { collection, singleton, type Row } from "./db";

/* ---------- Administratrices, sessions, connexions, journal ---------- */

export interface AdminUser extends Row {
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  passwordHash: string;
  active: boolean;
  totpSecret?: string;
  totpEnabled: boolean;
  /** Dernier pas TOTP accepté : un même code ne peut pas être rejoué. */
  lastTotpStep?: number;
  /** Codes de secours à usage unique (empreintes SHA-256). */
  recoveryCodes?: string[];
  lastLoginAt?: string;
  lastLoginIp?: string;
  knownIps: string[];
  reset?: { hash: string; exp: number };
  mustChangePassword?: boolean;
}

export interface AdminSession extends Row {
  adminId: string;
  lastSeen: string;
  expiresAt: string;
  ip: string;
  ua: string;
  /** « mfa » : mot de passe validé, code de double authentification attendu */
  stage: "ok" | "mfa";
  /** Dernière confirmation d'identité (actions sensibles) */
  reauthAt?: string;
}

export interface LoginEvent extends Row {
  email: string;
  success: boolean;
  ip: string;
  ua: string;
  adminId?: string;
  reason?: string;
}

export interface AuditEntry extends Row {
  actorId: string;
  actorName: string;
  action: string;
  entity: string;
  entityId?: string;
  label: string;
  before?: unknown;
  after?: unknown;
  ip?: string;
}

export interface ResetRequest extends Row {
  email: string;
  adminId?: string;
  status: "open" | "done";
}

export const resetRequests = collection<ResetRequest>("reset_requests");
export const admins = collection<AdminUser>("admins");
export const adminSessions = collection<AdminSession>("admin_sessions");
export const loginEvents = collection<LoginEvent>("login_events");
export const auditLog = collection<AuditEntry>("audit_log");

/* ---------- Paramètres de l'association et du site ---------- */

export interface AssociationInfo {
  name: string; legalName: string; form: string; siret: string; rna: string; address: string; postalCode: string; city: string;
  phone: string; email: string; website: string; president: string; presidentTitle: string;
  /** Directrice de la publication (mentions légales). */
  publicationDirector: string;
  instagram: string; tiktok: string;
}


export const DEFAULT_AUTOMATIONS = {
  welcome: true,
  /** E-mail de bienvenue envoyé à la nouvelle adhérente une fois son adhésion validée (avec l'invitation à connecter Discord) */
  membershipWelcome: true,
  paymentConfirmation: true,
  paymentFailedReminder: true,
  renewalJ30: true,
  renewalJ7: true,
  eventConfirmation: true,
  eventReminderJ7: true,
  eventReminderJ1: true,
  waitlistNotify: true,
  /** E-mail aux adhérentes actives à chaque nouvel article, nouvel événement, nouveau produit de la boutique */
  notifyArticle: true,
  notifyEvent: true,
  notifyProduct: true,
  /** Rappels automatiques 7 et 15 jours après la création du compte si l'adhésion n'est toujours pas réglée ou validée */
  paymentReminderJ7: true,
  paymentReminderJ15: true,
};

const settingsStore = singleton("settings", {
  association: <AssociationInfo>{
    name: assoDefaults.name,
    legalName: assoDefaults.legalName,
    form: assoDefaults.form,
    siret: assoDefaults.siret,
    rna: assoDefaults.rna,
    address: assoDefaults.address,
    postalCode: assoDefaults.postalCode,
    city: assoDefaults.city,
    phone: assoDefaults.phone,
    email: assoDefaults.email,
    website: assoDefaults.website,
    president: assoDefaults.president,
    presidentTitle: assoDefaults.presidentTitle,
    publicationDirector: assoDefaults.publicationDirector,
    instagram: "https://www.instagram.com/lesdamesduparc/",
    tiktok: "https://www.tiktok.com/@lesdamesduparc",
  },
  site: { title: "Les Dames du Parc", description: "Plus qu'un groupe, une famille.", footerText: "Paris toujours, ensemble !", favicon: "" },
  emails: { fromName: "Les Dames du Parc", fromEmail: assoDefaults.email as string, signature: "Avec toute notre passion,\nLes Dames du Parc" },
  payments: { currency: "EUR", refundPolicy: "Remboursement sur demande, au cas par cas.", onlinePayment: true },
  /**
   * paused/limit : campagne d'adhésions (Adhérentes > Campagne d'adhésions) — nouvelles adhérentes uniquement, jamais les
   * renouvellements. Ouvertes par défaut (limit = 200) : `paused` les ferme totalement quel que soit le nombre ; sinon,
   * bloquées automatiquement dès que `limit` est atteint (augmenter `limit` rouvre aussitôt).
   */
  adhesions: {
    seasonStartMonth: 9,
    renewalReminderDays: [30, 7],
    autoRenew: false,
    openToAll: true,
    paused: false,
    limit: 200,
  },
  /** Bannière d'information au-dessus de l'en-tête, sur tout le site ; absente ou expirée (until) = rien à afficher. */
  flash: null as { message: string; until: string } | null,
  automations: { ...DEFAULT_AUTOMATIONS },
  security: { sessionTimeoutMin: 30, maxAttempts: 5, lockoutMin: 15, require2fa: true },
  retention: { inactiveMonths: 36 },
  /** Permissions personnalisées par rôle (la super administratrice les modifie) ; absent = permissions d'origine du rôle */
  rolePermissions: {} as Record<string, string[]>,
  /** Photo de chaque page d'erreur (clé = code : 404, 500, paiement…) ; absent = photo d'origine */
  errorPhotos: {} as Record<string, string>,
  invoice: { prefix: "FAC", legalNote: "TVA non applicable : association à but non lucratif (à confirmer avec votre expert-comptable).", signerName: "", signerTitle: "", stamp: "", signature: "" },
});

/** Les automatisations introduites après coup (valeurs d'origine) sont ajoutées aux réglages déjà enregistrés. */
export const settings = {
  ...settingsStore,
  get: async () => {
    const s = await settingsStore.get();
    // Champs ajoutés après coup (ex. directrice de la publication) : valeur par défaut tant qu'ils n'ont pas été enregistrés.
    return { ...s, association: { ...s.association, publicationDirector: s.association.publicationDirector ?? assoDefaults.publicationDirector }, automations: { ...DEFAULT_AUTOMATIONS, ...s.automations } };
  },
};

/** Mises à jour ponctuelles des données, appliquées une seule fois : un repère par mise à jour (jamais de liste partagée réécrite en parallèle). */
const legacyMigrations = singleton("data_migrations", { done: [] as string[] });
export const migrationDone = async (name: string) => (await singleton(`migration_${name}`, { at: "" }).get()).at !== "" || (await legacyMigrations.get()).done.includes(name);
export const markMigrationDone = (name: string) => singleton(`migration_${name}`, { at: "" }).set({ at: new Date().toISOString() });

const LEGAL_2026_10 = "infos-legales-sirene-2026-10";
let legalMigration: Promise<void> | null = null;

/**
 * « infos-legales-sirene-2026-10 » : identité légale de l'association reprise de l'avis de situation SIRENE (SIRET, RNA,
 * siège), adresse de contact et directrice de la publication. Les valeurs fictives de départ (téléphone, présidente) sont
 * effacées ; une valeur réelle déjà saisie dans l'administration est conservée.
 * À appeler hors de tout verrou (rendu d'une page), jamais depuis settings.get().
 */
export function applyLegalInfoOnce() {
  legalMigration ??= (async () => {
    if (await migrationDone(LEGAL_2026_10)) return;
    const cur = (await settingsStore.get()).association;
    await settingsStore.set({
      association: {
        ...cur,
        legalName: assoDefaults.legalName,
        siret: assoDefaults.siret,
        rna: assoDefaults.rna,
        address: assoDefaults.address,
        postalCode: assoDefaults.postalCode,
        city: assoDefaults.city,
        email: assoDefaults.email,
        publicationDirector: assoDefaults.publicationDirector,
        phone: cur.phone === "01 23 45 67 89" ? "" : cur.phone,
        president: cur.president === "Camille Fictive" ? "" : cur.president,
      },
    });
    await markMigrationDone(LEGAL_2026_10);
  })().catch((err) => {
    legalMigration = null;
    console.error("[paramètres] mise à jour des informations légales impossible", err);
  });
  return legalMigration;
}

export type Settings = Awaited<ReturnType<typeof settings.get>>;
