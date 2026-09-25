export interface GalleryPhoto {
  id: string;
  src: string;
  alt: string;
  caption: string;
  /** Classes de placement dans la mosaïque (grille 12 colonnes dès md) */
  span: string;
}

export const gallery: GalleryPhoto[] = [
  { id: "ldc-2025", src: "/images/ligue-des-champions-2025.webp", alt: "Les joueurs du PSG soulèvent la Ligue des champions sous une pluie de confettis dorés", caption: "Paris sur le toit de l'Europe", span: "col-span-2 row-span-2 md:col-span-6" },
  { id: "tribune-orange", src: "/images/tribune-fumigene-orange.webp", alt: "Supporters parisiens dans la lumière orange d'un fumigène", caption: "Les voix du Parc", span: "md:col-span-3" },
  { id: "foule-drapeau", src: "/images/foule-drapeau-paris.webp", alt: "Foule de supporters derrière un drapeau Paris", caption: "Ensemble, toujours", span: "md:col-span-3" },
  { id: "fumee-verte", src: "/images/drapeau-fumee-verte.webp", alt: "Drapeau du PSG flottant dans une fumée turquoise", caption: "Drapeaux au vent", span: "md:col-span-3" },
  { id: "drapeau-gros-plan", src: "/images/drapeau-paris-gros-plan.webp", alt: "Gros plan sur un drapeau du Paris Saint-Germain", caption: "Rouge, bleu, Paris", span: "md:col-span-3" },
  { id: "tunnel", src: "/images/tunnel-ici-cest-paris.webp", alt: "Couloir lumineux du Parc des Princes, Ici c'est Paris", caption: "Ici, c'est Paris", span: "md:col-span-4" },
  { id: "pelouse", src: "/images/parc-pelouse-tribunes.webp", alt: "La pelouse du Parc des Princes face aux tribunes", caption: "Le Parc avant le coup d'envoi", span: "md:col-span-4" },
  { id: "facade", src: "/images/parc-des-princes-facade.webp", alt: "Façade en béton du Parc des Princes vue depuis le périphérique", caption: "Le Parc des Princes", span: "col-span-2 md:col-span-4" },
  { id: "vestiaire", src: "/images/vestiaire-maillots.webp", alt: "Vestiaire du PSG avec les maillots accrochés", caption: "Dans le vestiaire", span: "col-span-2 md:col-span-6" },
  { id: "vestiaire-fauteuils", src: "/images/vestiaire-fauteuils.webp", alt: "Rangée de fauteuils bleus dans le vestiaire du PSG", caption: "Avant le match", span: "md:col-span-3" },
  { id: "sieges", src: "/images/sieges-rouges-bleus.webp", alt: "Sièges rouges et bleus floqués Paris Saint-Germain", caption: "Ta place t'attend", span: "md:col-span-3" },
  { id: "fans-fumigene", src: "/images/fans-drapeau-fumigene.webp", alt: "Supporters applaudissant sous un drapeau et un fumigène", caption: "Vibrer ensemble", span: "col-span-2 md:col-span-8" },
  { id: "interieur", src: "/images/parc-des-princes-interieur.webp", alt: "Tribunes bleues et rouges du Parc des Princes", caption: "Les tribunes du Parc", span: "col-span-2 md:col-span-4" },
];
