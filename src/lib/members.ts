import { ageAt } from "./registration";

export const ADULT_AGE = 18;
export const MAX_AUTH_FILES = 3;
export const MAX_AUTH_FILE_BYTES = 5 * 1024 * 1024;

export interface MemberAddress {
  line1: string;
  line2?: string;
  postalCode: string;
  city: string;
  country: string;
}

export interface Guardian {
  firstName: string;
  lastName: string;
  relation: "mere" | "pere" | "tuteur";
  email: string;
  phone: string;
}

export const guardianRelations: Record<Guardian["relation"], string> = { mere: "Mère", pere: "Père", tuteur: "Représentant légal" };

export interface MemberInput {
  firstName: string;
  lastName: string;
  birthDate: string;
  email: string;
  phone: string;
  address: MemberAddress;
  password: string;
  guardian?: Guardian;
  consents: { rules: boolean; privacy: boolean; image?: boolean; guardianConsent?: boolean };
}

export interface AuthorizationFile {
  id: string;
  name: string;
  size: number;
}

/** Fiche membre telle qu'elle est stockée (sans mot de passe ni chemin de fichier). */
export interface MemberPublic {
  id: string;
  memberNumber: string;
  /** Jeton secret intégré au QR code de la carte : ouvre la page de vérification. */
  token: string;
  season: string;
  firstName: string;
  lastName: string;
  birthDate: string;
  email: string;
  phone: string;
  address: MemberAddress;
  guardian?: Guardian;
  authorizations: AuthorizationFile[];
  consents: MemberInput["consents"];
  /** ISO : date d'adhésion et fin de validité (fin de saison) */
  joinedAt: string;
  validUntil: string;
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE = /^[+0-9][0-9 .()-]{7,19}$/;
const POSTAL = /^[0-9A-Za-z -]{3,10}$/;

export const isMinor = (birthDate: string, on = new Date().toISOString().slice(0, 10)) =>
  Boolean(birthDate) && !Number.isNaN(Date.parse(birthDate)) && ageAt(birthDate, on) < ADULT_AGE;

export const passwordIssue = (p: string | undefined) => (!p || p.length < 10 ? "10 caractères minimum." : !/[A-Za-z]/.test(p) || !/[0-9]/.test(p) ? "Mélangez lettres et chiffres." : "");

/** Validation partagée client / serveur. `fileCount` : nombre de PDF d'autorisation parentale joints. */
export function validateMember(input: Partial<MemberInput>, fileCount: number): Record<string, string> {
  const e: Record<string, string> = {};
  const today = new Date().toISOString().slice(0, 10);
  if (!input.firstName?.trim()) e.firstName = "Prénom requis.";
  if (!input.lastName?.trim()) e.lastName = "Nom requis.";
  if (!input.birthDate || Number.isNaN(Date.parse(input.birthDate)) || input.birthDate > today) e.birthDate = "Date de naissance invalide.";
  else if (ageAt(input.birthDate, today) < 5 || ageAt(input.birthDate, today) > 110) e.birthDate = "Date de naissance invalide.";
  if (!input.email || !EMAIL.test(input.email.trim())) e.email = "Adresse e-mail invalide.";
  if (!input.phone || !PHONE.test(input.phone)) e.phone = "Numéro de téléphone invalide.";
  const a = input.address;
  if (!a?.line1?.trim()) e.line1 = "Adresse requise.";
  if (!a?.postalCode || !POSTAL.test(a.postalCode)) e.postalCode = "Code postal invalide.";
  if (!a?.city?.trim()) e.city = "Ville requise.";
  if (!a?.country?.trim()) e.country = "Pays requis.";
  const pwd = passwordIssue(input.password);
  if (pwd) e.password = pwd;

  if (input.birthDate && isMinor(input.birthDate)) {
    const g = input.guardian;
    if (!g?.firstName?.trim()) e.guardianFirstName = "Prénom du responsable requis.";
    if (!g?.lastName?.trim()) e.guardianLastName = "Nom du responsable requis.";
    if (!g?.relation || !(g.relation in guardianRelations)) e.guardianRelation = "Précisez le lien avec le ou la mineur(e).";
    if (!g?.email || !EMAIL.test(g.email.trim())) e.guardianEmail = "E-mail du responsable invalide.";
    if (!g?.phone || !PHONE.test(g.phone)) e.guardianPhone = "Téléphone du responsable invalide.";
    if (fileCount < 1) e.authorization = "L'autorisation parentale signée (PDF) est obligatoire.";
    if (fileCount > MAX_AUTH_FILES) e.authorization = `${MAX_AUTH_FILES} fichiers maximum.`;
    if (!input.consents?.guardianConsent) e.guardianConsent = "Le responsable légal doit autoriser l'adhésion.";
  }
  if (!input.consents?.rules) e.rules = "Vous devez accepter les statuts et le règlement intérieur.";
  if (!input.consents?.privacy) e.privacy = "Vous devez accepter le traitement de vos données.";
  return e;
}

const letters = (s: string, n: number) => (s.normalize("NFD").replace(/[^A-Za-z]/g, "").toUpperCase() + "XXX").slice(0, n);

/**
 * Numéro de membre : 3 premières lettres du nom + 3 premières lettres du prénom + date de naissance (JJMMAA)
 * + « -LDDP » + année d'inscription. Ex. DUQQUE120399-LDDP2026. En cas d'homonymie (mêmes lettres, même date),
 * une lettre de départage (B, C…) est ajoutée en fin de numéro.
 */
export function generateMemberNumber(lastName: string, firstName: string, birthDate: string, year: number, taken: ReadonlySet<string>) {
  const [y, m, d] = birthDate.split("-");
  const base = `${letters(lastName, 3)}${letters(firstName, 3)}${d}${m}${y.slice(2)}-LDDP${year}`;
  if (!taken.has(base)) return base;
  for (let i = 1; i < 26; i++) {
    const candidate = `${base}${String.fromCharCode(65 + i)}`;
    if (!taken.has(candidate)) return candidate;
  }
  return `${base}${taken.size}`;
}
