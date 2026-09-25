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

const all: readonly Chapter[] = [
  { slug: "lettre-d-introduction", number: "01", title: "Lettre d’introduction", sub: "Qui nous sommes, en quelques lignes.", icon: "Mail" },
  { slug: "notre-histoire", number: "02", title: "Notre histoire", sub: "D’un message à une communauté.", icon: "BookOpen" },
  { slug: "qui-sommes-nous", number: "03", title: "Qui sommes-nous ?", sub: "22 supportrices, de 19 à 40 ans, une même passion.", icon: "Users" },
  { slug: "nos-valeurs", number: "04", title: "Nos valeurs", sub: "Six mots.", icon: "Heart" },
  { slug: "pourquoi-un-fan-club-feminin", number: "05", title: "Pourquoi un fan club 100 % féminin", sub: "Pas pour se séparer, pour se rencontrer.", icon: "Venus" },
  { slug: "ce-que-nous-voulons-construire", number: "06", title: "Ce que nous voulons construire", sub: "Quatre ambitions.", icon: "Map" },
  { slug: "la-voix-des-supportrices", number: "07", title: "La voix des supportrices", sub: h.voices.sub, icon: "Megaphone" },
  { slug: "notre-communaute-au-quotidien", number: "08", title: "Notre communauté au quotidien", sub: h.daily.sub, icon: "MessagesSquare" },
  { slug: "en-dehors-des-jours-de-match", number: "09", title: "En dehors des jours de match", sub: h.offMatch.sub, icon: "Route" },
  { slug: "pourquoi-le-paris-saint-germain", number: "10", title: "Pourquoi le Paris Saint-Germain était une évidence", sub: h.evidence.sub, icon: "Landmark" },
  { slug: "conclusion", number: null, title: "Conclusion", sub: "Unies par la même passion.", icon: "Flag" },
  { slug: "adhesion", number: null, title: "Communauté et adhésion", sub: "Une communauté ouverte à toutes les supportrices du PSG, et une adhésion pour celles qui souhaitent aller plus loin.", icon: "IdCard" },
];

/** « Le groupe » : six parties seulement. */
export const chapters: readonly Chapter[] = all.slice(0, 6);

/** Chapitres retirés de la rubrique (contenu conservé dans histoire.ts et bodies.tsx), au cas où ils reviendraient. */
export const retiredChapters: readonly Chapter[] = all.slice(6, 11);

/** Page d'adhésion, désormais sous « Rejoindre le groupe ». */
export const adhesionChapter: Chapter = all[11];

export const getChapter = (slug: string) => chapters.find((c) => c.slug === slug);
