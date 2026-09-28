/** Types et règles de la boutique partagés entre le serveur et le navigateur. */
export interface ShopProduct {
  id: string;
  name: string;
  category: string;
  tagline: string;
  description: string;
  details: string[];
  priceCents: number;
  compareAtCents?: number;
  images: string[];
  videos?: string[];
  sizes?: string[];
  isNew?: boolean;
  /** Quantités disponibles par taille (« _ » si le produit n'a pas de taille) ; absent = stock non suivi */
  stock?: Record<string, number>;
}

export interface ShopRules {
  standardCents: number;
  freeFromCents: number;
}

export interface ShopCatalog {
  products: ShopProduct[];
  rules: ShopRules;
  categories: string[];
}

export const NO_SIZE = "_";

/** Quantité disponible pour une taille (Infinity si le stock n'est pas suivi). */
export function availableQty(p: ShopProduct, size?: string) {
  if (!p.stock) return Infinity;
  return Math.max(p.stock[size ?? NO_SIZE] ?? 0, 0);
}

export const isSoldOut = (p: ShopProduct) => (p.sizes ? p.sizes.every((s) => availableQty(p, s) <= 0) : availableQty(p) <= 0);
