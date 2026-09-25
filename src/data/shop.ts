/**
 * Catalogue de départ de la boutique (données fictives, photos provisoires).
 * Il alimente la base au premier lancement ; les prix, stocks et produits se gèrent ensuite dans le back-office.
 */
import type { ShopProduct } from "@/lib/shop";

export type { ShopProduct };
export type ShopCategory = "Écharpes" | "Vêtements" | "Accessoires";

const scarf = "/images/produit-echarpe.webp";
const hoodie = "/images/produit-sweat.webp";
const apparelSizes = ["XS", "S", "M", "L", "XL"];

/** Catalogue de départ (données fictives) : sert de base au back-office, qui gère ensuite les produits. */
export const products: ShopProduct[] = [
  {
    id: "echarpe-fiere-parisienne",
    name: "Écharpe Fière d'être parisienne",
    category: "Écharpes",
    tagline: "L'écharpe des Dames du Parc",
    description: "L'écharpe de tribune aux couleurs de Paris, tissée en jacquard avec franges bicolores et le blason du groupe.",
    details: ["Jacquard double face", "Franges rose et marine", "Longueur 140 cm", "Blason des Dames du Parc"],
    priceCents: 2490,
    compareAtCents: 2990,
    images: [scarf, hoodie],
    isNew: true,
  },
  {
    id: "sweat-champions-signature",
    name: "Sweat à capuche Champions Signature",
    category: "Vêtements",
    tagline: "Le confort des soirs de match",
    description: "Un sweat à capuche noir en molleton épais, coupe femme, écusson brodé sur la poitrine et poche kangourou.",
    details: ["Molleton 80 % coton", "Écusson brodé", "Coupe femme", "Lavage à 30 °C"],
    priceCents: 6490,
    compareAtCents: 7990,
    images: [hoodie, scarf],
    sizes: apparelSizes,
    isNew: true,
  },
  {
    id: "echarpe-collector",
    name: "Écharpe Collector Parc des Princes",
    category: "Écharpes",
    tagline: "Édition limitée",
    description: "Une édition numérotée pour les soirs européens, à garder précieusement ou à brandir en tribune.",
    details: ["Édition numérotée", "Jacquard haute densité", "Longueur 150 cm"],
    priceCents: 3290,
    images: [scarf, hoodie],
    isNew: true,
  },
  {
    id: "tshirt-dames-du-parc",
    name: "T-shirt Dames du Parc",
    category: "Vêtements",
    tagline: "Le basique du groupe",
    description: "Un t-shirt en coton bio, coupe droite, avec le blason du groupe floqué sur la poitrine.",
    details: ["Coton biologique", "Blason floqué", "Coupe droite"],
    priceCents: 2990,
    images: [hoodie, scarf],
    sizes: apparelSizes,
  },
  {
    id: "bonnet-tribune",
    name: "Bonnet Tribune",
    category: "Accessoires",
    tagline: "Pour les matchs d'hiver",
    description: "Un bonnet à revers en maille douce, aux couleurs de Paris, pour tenir les tribunes de novembre à mars.",
    details: ["Maille acrylique douce", "Taille unique", "Broderie blason"],
    priceCents: 1990,
    images: [scarf, hoodie],
  },
  {
    id: "tote-bag-parisienne",
    name: "Tote bag Parisienne",
    category: "Accessoires",
    tagline: "Toujours prête pour le Parc",
    description: "Un grand sac en coton épais, poignées longues, imprimé « Fière d'être parisienne ».",
    details: ["Coton 280 g/m²", "Poignées longues", "Impression durable"],
    priceCents: 1490,
    images: [scarf, hoodie],
  },
];

export const shopCategories: ShopCategory[] = ["Écharpes", "Vêtements", "Accessoires"];

/** Règles de livraison de départ ; le back-office les ajuste ensuite. */
export const shipping = {
  standardCents: 490,
  freeFromCents: 6000,
  eventPickupCents: 0,
} as const;

export const heroSlides = [
  { id: "s1", index: "01", label: "Fière d'être parisienne", title: "Fière d'être parisienne", text: "L'écharpe des Dames du Parc, tissée aux couleurs de Paris.", image: scarf, href: "/boutique/echarpe-fiere-parisienne" },
  { id: "s2", index: "02", label: "Le confort des soirs de match", title: "Le confort des soirs de match", text: "Le sweat à capuche Champions Signature, pour tenir de la première à la dernière minute.", image: hoodie, href: "/boutique/sweat-champions-signature" },
  { id: "s3", index: "03", label: "Des pièces pour toute l'année", title: "Des pièces pour toute l'année", text: "T-shirts, bonnets et sacs : du Parc à la ville, affichez vos couleurs.", image: scarf, href: "/boutique#collection" },
  { id: "s4", index: "04", label: "Éditions limitées", title: "Éditions limitées", text: "Des séries numérotées, une fois épuisées, elles ne reviennent pas.", image: hoodie, href: "/boutique/echarpe-collector" },
  { id: "s5", index: "05", label: "Faite par les tribunes", title: "Faite par les tribunes, pour Paris", text: "Chaque achat soutient la vie du groupe et ses rendez-vous de la saison.", image: scarf, href: "/rejoindre-le-groupe" },
] as const;
