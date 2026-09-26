/** Photos de la rubrique « Le groupe » : une par chapitre. Valeurs par défaut ; l'administration peut les remplacer (Site internet > Photos du groupe). */
export interface GroupPhoto {
  src: string;
  alt: string;
}

export const GROUP_SLOTS = [
  { slug: "lettre-d-introduction", label: "01 · Lettre d'introduction" },
  { slug: "notre-histoire", label: "02 · Notre histoire" },
  { slug: "qui-sommes-nous", label: "03 · Qui sommes-nous ?" },
  { slug: "nos-valeurs", label: "04 · Nos valeurs" },
  { slug: "pourquoi-un-fan-club-feminin", label: "05 · Pourquoi un fan club 100 % féminin" },
  { slug: "ce-que-nous-voulons-construire", label: "06 · Ce que nous voulons construire" },
  { slug: "adhesion", label: "Adhésion (Rejoindre le groupe)" },
] as const;

export const DEFAULT_GROUP_PHOTOS: Record<string, GroupPhoto> = {
  "lettre-d-introduction": { src: "/images/supportrices-parc-des-princes.webp", alt: "Supportrices du Paris Saint-Germain chantant dans les tribunes du Parc des Princes" },
  "notre-histoire": { src: "/images/ligue-des-champions-2025.webp", alt: "Les joueurs du PSG fêtent la Ligue des Champions sous une pluie de confettis dorés" },
  "qui-sommes-nous": { src: "/images/fans-drapeau-fumigene.webp", alt: "Supporters du PSG et drapeau dans la fumée d'un fumigène" },
  "nos-valeurs": { src: "/images/drapeau-paris-gros-plan.webp", alt: "Gros plan sur un drapeau Paris Saint-Germain porté par la foule" },
  "pourquoi-un-fan-club-feminin": { src: "/images/drapeau-fumee-verte.webp", alt: "Drapeau Paris dans la fumée verte d'un fumigène, au milieu des supporters" },
  "ce-que-nous-voulons-construire": { src: "/images/tribune-fumigene-orange.webp", alt: "Supporters du PSG, poings levés dans la lumière orange d'un fumigène" },
  adhesion: { src: "/images/foule-drapeau-paris.webp", alt: "Foule de supporters derrière un drapeau Paris" },
};
