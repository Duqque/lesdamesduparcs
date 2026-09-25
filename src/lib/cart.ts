"use client";

import { useMemo, useSyncExternalStore } from "react";
import { useShop } from "@/components/shop/ShopProvider";
import type { ShopCatalog } from "@/lib/shop";

export interface CartLine {
  productId: string;
  size?: string;
  qty: number;
}

const KEY = "ddp-cart";
const EMPTY = "[]";
let raw: string | null = null;
let drawerOpen = false;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

function load() {
  if (raw === null) {
    try {
      raw = localStorage.getItem(KEY) ?? EMPTY;
    } catch {
      raw = EMPTY;
    }
  }
  return raw;
}

function save(lines: CartLine[]) {
  raw = JSON.stringify(lines);
  try {
    localStorage.setItem(KEY, raw);
  } catch {}
  emit();
}

if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key === KEY) {
      raw = null;
      emit();
    }
  });
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

const parse = (s: string): CartLine[] => {
  try {
    const v = JSON.parse(s) as CartLine[];
    return v.filter((l) => l && typeof l.productId === "string" && Number.isInteger(l.qty) && l.qty > 0);
  } catch {
    return [];
  }
};

/** Lignes du panier, limitées aux produits actuellement en vente (un produit retiré du catalogue disparaît du panier). */
export function useCartLines(): CartLine[] {
  const snap = useSyncExternalStore(subscribe, load, () => EMPTY);
  const { products } = useShop();
  return useMemo(() => parse(snap).filter((l) => products.some((p) => p.id === l.productId)), [snap, products]);
}

export function useDrawerOpen() {
  return useSyncExternalStore(subscribe, () => drawerOpen, () => false);
}

export const setDrawer = (open: boolean) => {
  drawerOpen = open;
  emit();
};

const sameLine = (a: CartLine, b: CartLine) => a.productId === b.productId && a.size === b.size;
const current = () => parse(load());

export function addToCart(line: CartLine, openDrawer = true) {
  const lines = current();
  const i = lines.findIndex((l) => sameLine(l, line));
  if (i >= 0) lines[i] = { ...lines[i], qty: Math.min(lines[i].qty + line.qty, 10) };
  else lines.push({ ...line, qty: Math.min(line.qty, 10) });
  save(lines);
  if (openDrawer) setDrawer(true);
}

export function setQty(line: CartLine, qty: number) {
  const lines = current().flatMap((l) => (sameLine(l, line) ? (qty > 0 ? [{ ...l, qty: Math.min(qty, 10) }] : []) : [l]));
  save(lines);
}

export const clearCart = () => save([]);

export interface Totals {
  count: number;
  subtotalCents: number;
  shippingCents: (mode: "home" | "event") => number;
}

export function computeTotals(lines: CartLine[], catalog: ShopCatalog): Totals {
  const { products, rules } = catalog;
  const subtotalCents = lines.reduce((n, l) => n + (products.find((p) => p.id === l.productId)?.priceCents ?? 0) * l.qty, 0);
  return {
    count: lines.reduce((n, l) => n + l.qty, 0),
    subtotalCents,
    shippingCents: (mode) => (mode === "event" || subtotalCents === 0 || subtotalCents >= rules.freeFromCents ? 0 : rules.standardCents),
  };
}
