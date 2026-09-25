import type { ClubEvent } from "@/types";

export type RegistrationStatus = "confirmed" | "awaiting_payment" | "paid";

export interface RegistrationInput {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  places: number;
  birthDate?: string;
  guardian?: { name: string; phone: string; email: string; consent: boolean };
  emergency: { name: string; phone: string };
  allergies?: string;
  comment?: string;
  consents: { rules: boolean; privacy: boolean; image?: boolean };
}

export interface Registration extends RegistrationInput {
  id: string;
  eventId: string;
  memberNumber: string;
  amountCents: number;
  status: RegistrationStatus;
  stripeSessionId?: string;
  createdAt: string;
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE = /^[+0-9][0-9 .()-]{7,19}$/;

export function ageAt(birthDate: string, on: string) {
  const b = new Date(`${birthDate}T12:00:00Z`);
  const d = new Date(`${on}T12:00:00Z`);
  let age = d.getUTCFullYear() - b.getUTCFullYear();
  if (d.getUTCMonth() < b.getUTCMonth() || (d.getUTCMonth() === b.getUTCMonth() && d.getUTCDate() < b.getUTCDate())) age--;
  return age;
}

export const formatEuros = (cents: number) => (cents === 0 ? "Gratuit" : `${(cents / 100).toLocaleString("fr-FR", { minimumFractionDigits: cents % 100 ? 2 : 0 })} €`);

/** Validation partagée client / serveur. Retourne un dictionnaire d'erreurs par champ (vide si valide). */
export function validateRegistration(input: Partial<RegistrationInput>, event: ClubEvent, remaining: number): Record<string, string> {
  const e: Record<string, string> = {};
  const cfg = event.registration;
  if (!input.firstName?.trim()) e.firstName = "Prénom requis.";
  if (!input.lastName?.trim()) e.lastName = "Nom requis.";
  if (!input.email || !EMAIL.test(input.email)) e.email = "Adresse e-mail invalide.";
  if (!input.phone || !PHONE.test(input.phone)) e.phone = "Numéro de téléphone invalide.";
  const places = cfg.singlePlace ? 1 : Number(input.places);
  if (!Number.isInteger(places) || places < 1 || places > 4) e.places = "Entre 1 et 4 places.";
  else if (places > remaining) e.places = remaining > 0 ? `Il ne reste que ${remaining} place(s).` : "Événement complet.";
  if (!input.emergency?.name?.trim()) e.emergencyName = "Contact d'urgence requis.";
  if (!input.emergency?.phone || !PHONE.test(input.emergency.phone)) e.emergencyPhone = "Téléphone du contact d'urgence invalide.";
  if (cfg.guardianRequired) {
    if (!input.birthDate || Number.isNaN(Date.parse(input.birthDate))) e.birthDate = "Date de naissance requise.";
    else {
      const age = ageAt(input.birthDate, event.date);
      if (cfg.minAge !== undefined && age < cfg.minAge) e.birthDate = `Réservé aux ${cfg.minAge} à ${cfg.maxAge} ans (âge le jour de l'événement).`;
      if (cfg.maxAge !== undefined && age > cfg.maxAge) e.birthDate = `Réservé aux ${cfg.minAge} à ${cfg.maxAge} ans (âge le jour de l'événement).`;
    }
    if (!input.guardian?.name?.trim()) e.guardianName = "Nom du responsable légal requis.";
    if (!input.guardian?.phone || !PHONE.test(input.guardian.phone)) e.guardianPhone = "Téléphone du responsable invalide.";
    if (!input.guardian?.email || !EMAIL.test(input.guardian.email)) e.guardianEmail = "E-mail du responsable invalide.";
    if (!input.guardian?.consent) e.guardianConsent = "L'autorisation parentale est indispensable.";
  }
  if (!input.consents?.rules) e.rules = "Vous devez accepter le règlement.";
  if (!input.consents?.privacy) e.privacy = "Vous devez accepter le traitement de vos données.";
  return e;
}
