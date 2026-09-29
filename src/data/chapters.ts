import { histoire as h } from "@/data/histoire";

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

/**
 * Les six premiers chapitres du dossier d'origine (lettre, histoire, qui sommes-nous, valeurs, pourquoi un fan club féminin, ce que
 * nous voulons construire) ont été réunis dans une seule page « Qui sommes-nous » (voir src/data/groupe.ts et
 * src/components/group/QuiSommesNousBody.tsx) : ils n'existent plus comme sous-pages séparées.
 */
const all: readonly Chapter[] = [
  { slug: "la-voix-des-supportrices", number: "07", title: "La voix des supportrices", sub: h.voices.sub, icon: "Megaphone" },
  { slug: "notre-communaute-au-quotidien", number: "08", title: "Notre communauté au quotidien", sub: h.daily.sub, icon: "MessagesSquare" },
  { slug: "en-dehors-des-jours-de-match", number: "09", title: "En dehors des jours de match", sub: h.offMatch.sub, icon: "Route" },
  { slug: "pourquoi-le-paris-saint-germain", number: "10", title: "Pourquoi le Paris Saint-Germain était une évidence", sub: h.evidence.sub, icon: "Landmark" },
  { slug: "conclusion", number: null, title: "Conclusion", sub: "Unies par la même passion.", icon: "Flag" },
  { slug: "adhesion", number: null, title: "Communauté & adhésion", sub: "Les Dames du Parc sont une communauté ouverte à toutes les supportrices du Paris Saint-Germain. Pour celles qui souhaitent aller plus loin, l’adhésion permet de devenir officiellement membre de la communauté et de bénéficier d’avantages réservés aux adhérentes tout au long de la saison.", icon: "IdCard" },
];

/** Plus aucun chapitre navigable sous « Qui sommes-nous » : la page est désormais unique (voir ci-dessus). */
export const chapters: readonly Chapter[] = [];

/** Chapitres retirés de la navigation (contenu conservé dans histoire.ts et bodies.tsx), au cas où ils reviendraient. */
export const retiredChapters: readonly Chapter[] = all.slice(0, 5);

/** Page d'adhésion, sous « Rejoindre le groupe ». */
export const adhesionChapter: Chapter = all[5];

export const getChapter = (slug: string) => chapters.find((c) => c.slug === slug);
