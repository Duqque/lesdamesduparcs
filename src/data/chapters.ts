export type ChapterIconName =
  | "Mail" | "BookOpen" | "Users" | "Heart" | "Venus" | "Map" | "Megaphone" | "MessagesSquare" | "Route" | "Landmark" | "Flag" | "IdCard";

export interface Chapter {
  slug: string;
  /** Numéro du chapitre dans le dossier, absent pour la conclusion et l'adhésion */
  number: string | null;
  title: string;
  sub: string;
  icon: ChapterIconName;
}

/** En-tête de la page « Adhésion » (/rejoindre-le-groupe/adhesion), seule page encore construite sur ce cadre. */
export const adhesionChapter: Chapter = { slug: "adhesion", number: null, title: "Communauté & adhésion", sub: "Les Dames du Parc sont une communauté ouverte à toutes les supportrices du Paris Saint-Germain. Pour celles qui souhaitent aller plus loin, l’adhésion permet de devenir officiellement membre de la communauté et de bénéficier d’avantages réservés aux adhérentes tout au long de la saison.", icon: "IdCard" };
