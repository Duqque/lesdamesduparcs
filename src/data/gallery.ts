export interface GalleryPhoto {
  id: string;
  src: string;
  alt: string;
  caption: string;
  /** Classes de placement dans la mosaïque (grille 12 colonnes dès md) */
  span: string;
}

export const gallery: GalleryPhoto[] = [
  { id: "identite-lys", src: "/images/identite-lys.webp", alt: "Fleur-de-lis et logo des Dames du Parc sur fond bleu nuit", caption: "Les Dames du Parc", span: "col-span-2 row-span-2 md:col-span-6" },
  { id: "identite-silhouettes", src: "/images/identite-silhouettes.webp", alt: "Silhouettes de supportrices, écharpes levées, sur fond bleu nuit", caption: "Unies, écharpes levées", span: "md:col-span-3" },
  { id: "identite-logo", src: "/images/identite-logo.webp", alt: "Logo des Dames du Parc sur fond bleu nuit", caption: "Notre emblème", span: "md:col-span-3" },
  { id: "fumee-verte", src: "/images/drapeau-fumee-verte.webp", alt: "Drapeau du PSG flottant dans une fumée turquoise", caption: "Drapeaux au vent", span: "md:col-span-3" },
  { id: "drapeau-gros-plan", src: "/images/drapeau-paris-gros-plan.webp", alt: "Gros plan sur un drapeau du Paris Saint-Germain", caption: "Rouge, bleu, Paris", span: "md:col-span-3" },
  { id: "tunnel", src: "/images/tunnel-ici-cest-paris.webp", alt: "Couloir lumineux du Parc des Princes, Ici c'est Paris", caption: "Ici, c'est Paris", span: "md:col-span-4" },
  { id: "pelouse", src: "/images/parc-pelouse-tribunes.webp", alt: "La pelouse du Parc des Princes face aux tribunes", caption: "Le Parc avant le coup d'envoi", span: "md:col-span-4" },
  { id: "facade", src: "/images/parc-des-princes-facade.webp", alt: "Façade en béton du Parc des Princes vue depuis le périphérique", caption: "Le Parc des Princes", span: "col-span-2 md:col-span-4" },
  { id: "vestiaire", src: "/images/vestiaire-maillots.webp", alt: "Vestiaire du PSG avec les maillots accrochés", caption: "Dans le vestiaire", span: "col-span-2 md:col-span-6" },
  { id: "vestiaire-fauteuils", src: "/images/vestiaire-fauteuils.webp", alt: "Rangée de fauteuils bleus dans le vestiaire du PSG", caption: "Avant le match", span: "md:col-span-3" },
  { id: "sieges", src: "/images/sieges-rouges-bleus.webp", alt: "Sièges rouges et bleus floqués Paris Saint-Germain", caption: "Ta place t'attend", span: "md:col-span-3" },
  { id: "identite-silhouette", src: "/images/identite-silhouette.webp", alt: "Silhouette d’une supportrice, écharpe levée, sur fond bleu nuit", caption: "Une même passion", span: "col-span-2 md:col-span-8" },
  { id: "interieur", src: "/images/parc-des-princes-interieur.webp", alt: "Tribunes bleues et rouges du Parc des Princes", caption: "Les tribunes du Parc", span: "col-span-2 md:col-span-4" },
];
