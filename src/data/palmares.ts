/** Palmarès du PSG masculin — source : https://www.psg.fr/football-masculin/palmares (61 titres). */
export const START_YEAR = 1970;

export interface TrophyCategory {
  id: string;
  label: string;
  years: readonly number[];
  /** gold : Ligue des champions · red : championnat · white : autres */
  tone: "gold" | "red" | "white";
}

/** Ordonné par prestige ; à compléter à chaque nouveau titre. */
export const trophies: readonly TrophyCategory[] = [
  { id: "ldc", label: "Ligue des champions", tone: "gold", years: [2025, 2026] },
  { id: "l1", label: "Ligue 1", tone: "red", years: [1986, 1994, 2013, 2014, 2015, 2016, 2018, 2019, 2020, 2022, 2023, 2024, 2025, 2026] },
  { id: "cdf", label: "Coupe de France", tone: "white", years: [1982, 1983, 1993, 1995, 1998, 2004, 2006, 2010, 2015, 2016, 2017, 2018, 2020, 2021, 2024, 2025] },
  { id: "cdl", label: "Coupe de la Ligue", tone: "white", years: [1995, 1998, 2008, 2014, 2015, 2016, 2017, 2018, 2020] },
  { id: "tdc", label: "Trophée des Champions", tone: "white", years: [1995, 1998, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2022, 2023, 2024, 2025] },
  { id: "supercup", label: "Supercoupe de l'UEFA", tone: "gold", years: [2025, 2026] },
  { id: "intercontinental", label: "Coupe intercontinentale", tone: "gold", years: [2025] },
  { id: "cwc", label: "Coupe des vainqueurs de coupe", tone: "gold", years: [1996] },
  { id: "intertoto", label: "Coupe Intertoto", tone: "white", years: [2001] },
  { id: "l2", label: "Ligue 2", tone: "white", years: [1971] },
];

/** Photos du loader, dans l'ordre chronologique du défilement. */
export const loaderPhotos = [
  "/images/parc-des-princes-facade.webp",
  "/images/tunnel-ici-cest-paris.webp",
  "/images/vestiaire-maillots.webp",
  "/images/vestiaire-fauteuils.webp",
  "/images/parc-des-princes-interieur.webp",
  "/images/sieges-rouges-bleus.webp",
  "/images/parc-pelouse-tribunes.webp",
  "/images/foule-drapeau-paris.webp",
  "/images/tribune-fumigene-orange.webp",
  "/images/drapeau-paris-gros-plan.webp",
  "/images/drapeau-fumee-verte.webp",
  "/images/fans-drapeau-fumigene.webp",
  "/images/ligue-des-champions-2025.webp",
] as const;
