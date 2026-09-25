"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { ShopCatalog, ShopProduct } from "@/lib/shop";

const empty: ShopCatalog = { products: [], rules: { standardCents: 490, freeFromCents: 6000 }, categories: [] };
const Ctx = createContext<ShopCatalog>(empty);

/** Catalogue de la boutique (produits actifs, stocks, règles de livraison), fourni par le serveur. */
export function ShopProvider({ catalog, children }: { catalog: ShopCatalog; children: ReactNode }) {
  return <Ctx.Provider value={catalog}>{children}</Ctx.Provider>;
}

export const useShop = () => useContext(Ctx);
export const useProduct = (id: string): ShopProduct | undefined => useContext(Ctx).products.find((p) => p.id === id);
