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
  instagram: string; tiktok: string;
}

export interface AdhesionCampaign {
  label: string;
  /** null = illimité. */
  limit: number | null;
  startedAt: string;
  /** Nombre d'adhésions déjà réglées au moment de l'activation : « places restantes » repart de zéro à chaque campagne. */
  baseline: number;
  /** Renseigné une fois le mail de relance envoyé aux comptes sans adhésion active (une seule fois par campagne). */
  emailedAt?: string;
  stoppedAt?: string;
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
    instagram: "https://www.instagram.com/lesdamesduparc/",
    tiktok: "https://www.tiktok.com/@lesdamesduparc",
  },
  site: { title: "Les Dames du Parc", description: "Plus qu'un groupe, une famille.", footerText: "Paris toujours, ensemble !", favicon: "" },
  emails: { fromName: "Les Dames du Parc", fromEmail: assoDefaults.email as string, signature: "Avec toute notre passion,\nLes Dames du Parc" },
  payments: { currency: "EUR", refundPolicy: "Remboursement sur demande, au cas par cas.", onlinePayment: true },
  /**
   * campaign : campagne d'adhésion en cours (nouvelles adhérentes uniquement, jamais les renouvellements) — sans campagne active,
   * les adhésions sont fermées. limit=null : illimité. baseline : nombre d'adhésions déjà réglées au moment de l'activation,
   * pour que « places restantes » reparte de zéro à chaque campagne. pastCampaigns : historique, pour mémoire dans l'administration.
   */
  adhesions: {
    seasonStartMonth: 9,
    renewalReminderDays: [30, 7],
    autoRenew: false,
    openToAll: true,
    campaign: null as AdhesionCampaign | null,
    pastCampaigns: [] as AdhesionCampaign[],
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
    return { ...s, automations: { ...DEFAULT_AUTOMATIONS, ...s.automations } };
  },
};

export type Settings = Awaited<ReturnType<typeof settings.get>>;
