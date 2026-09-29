/** Photos de la rubrique « Le groupe » : une par chapitre. Valeurs par défaut ; l'administration peut les remplacer (Site internet > Photos du groupe). */
export interface GroupPhoto {
  src: string;
  alt: string;
}

export const GROUP_SLOTS = [
  { slug: "bento-1", label: "Qui sommes-nous : grande photo" },
  { slug: "bento-2", label: "Qui sommes-nous : photo secondaire" },
  { slug: "pourquoi", label: "Qui sommes-nous : pourquoi un fan club féminin" },
  { slug: "construire", label: "Qui sommes-nous : ce que nous voulons construire" },
  { slug: "adhesion", label: "Adhésion (Rejoindre le groupe)" },
] as const;

export const DEFAULT_GROUP_PHOTOS: Record<string, GroupPhoto> = {
  "bento-1": { src: "/images/supportrices-parc-des-princes.webp", alt: "Supportrices du Paris Saint-Germain chantant dans les tribunes du Parc des Princes" },
  "bento-2": { src: "/images/tunnel-ici-cest-paris.webp", alt: "Le couloir des joueurs du Parc des Princes, « Ici c'est Paris »" },
  pourquoi: { src: "/images/identite-silhouette.webp", alt: "Silhouette d’une supportrice, écharpe levée, sur fond bleu nuit" },
  construire: { src: "/images/identite-silhouettes.webp", alt: "Silhouettes de supportrices, écharpes levées, sur fond bleu nuit" },
  adhesion: { src: "/images/identite-logo.webp", alt: "Logo des Dames du Parc sur fond bleu nuit" },
};
