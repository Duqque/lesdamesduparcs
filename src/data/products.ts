import type { Product } from "@/types";

export const featuredShop: {
  title: string;
  description: string;
  tagline: string;
  image: string;
  href: string;
  products: Product[];
} = {
  title: "Boutique",
  description: "Écharpes, maillots, goodies…",
  tagline: "Affiche ton soutien !",
  image: "/images/drapeau-paris-gros-plan.webp",
  href: "/boutique",
  products: [],
};
