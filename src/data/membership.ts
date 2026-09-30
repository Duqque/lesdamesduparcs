export const membership = {
  price: 12,
  unit: "saison",
  season: "2026 / 2027",
  joinHref: "/rejoindre-le-groupe/inscription",
  infoHref: "/rejoindre-le-groupe/adhesion",
  loginHref: "/profil",
} as const;

/** Avantages de l'adhésion (proposition 2026-2027). */
export const benefits = [
  { id: "events", kicker: "Événements", big: "Accès membres", sub: "soirées, afterworks, matchs" },
  { id: "card", kicker: "Carte", big: "Virtuelle", sub: "avec son QR code" },
  { id: "private", kicker: "Espace privé", big: "Entre membres", sub: "annonces et échanges" },
] as const;

export const agenda = [
  { id: "a1", date: "2026-10-17", tag: "Matchday", title: "PSG × Olympique de Marseille" },
  { id: "a2", date: "2026-10-24", tag: "Événement", title: "Soirée des Dames" },
  { id: "a3", date: "2026-11-08", tag: "Matchday", title: "Match à domicile · adversaire à confirmer" },
  { id: "a4", date: "2026-11-22", tag: "Membres", title: "Rencontre des Dames du Parc" },
] as const;

/** Aperçu de l'espace privé des membres. */
export const privateSpace = [
  { kicker: "Annonces", text: "Ouverture des inscriptions, actualités membres" },
  { kicker: "Événements", text: "Infos pratiques et rappels avant chaque rendez-vous" },
  { kicker: "Discussions", text: "Réactions aux matchs, vie de la communauté" },
] as const;
