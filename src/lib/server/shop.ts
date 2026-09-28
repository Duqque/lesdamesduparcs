import "server-only";
import { products as seedProducts, shipping as seedShipping, shopCategories } from "@/data/shop";
import { NO_SIZE, type ShopCatalog, type ShopProduct } from "@/lib/shop";
import type { OrderLine } from "@/lib/orders";
import { promoCodes, type PromoCode } from "./content";
import { collection, singleton, type Row } from "./db";
import { listOrders } from "./store";

export type ProductStatus = "draft" | "active" | "archived";

export interface Product extends Row {
  /** Identifiant = adresse : /boutique/[id] */
  name: string;
  category: string;
  tagline: string;
  description: string;
  details: string[];
  priceCents: number;
  compareAtCents?: number;
  images: string[];
  /** Vidéos du produit (MP4, WebM) */
  videos?: string[];
  sizes: string[];
  /** Quantités par taille (« _ » sans taille) ; utilisé seulement si trackStock */
  stock: Record<string, number>;
  trackStock: boolean;
  isNew: boolean;
  status: ProductStatus;
  order: number;
  sku?: string;
  origin?: "seed";
}

export const productsDb = collection<Product>("products", () =>
  seedProducts.map((p, i) => ({
    id: p.id,
    name: p.name,
    category: p.category,
    tagline: p.tagline,
    description: p.description,
    details: p.details,
    priceCents: p.priceCents,
    compareAtCents: p.compareAtCents,
    images: p.images,
    sizes: p.sizes ?? [],
    stock: Object.fromEntries((p.sizes ?? [NO_SIZE]).map((s) => [s, 40])),
    trackStock: true,
    isNew: Boolean(p.isNew),
    status: "active" as const,
    order: i + 1,
    sku: `DDP-${String(i + 1).padStart(3, "0")}`,
    origin: "seed" as const,
  })),
);

export const shopConfig = singleton("shop_config", {
  shipping: { standardCents: seedShipping.standardCents as number, freeFromCents: seedShipping.freeFromCents as number },
  lowStock: 5,
  categories: [...shopCategories] as string[],
});

export const stockKey = (size?: string) => size || NO_SIZE;

export const toPublic = (p: Product): ShopProduct => ({
  id: p.id,
  name: p.name,
  category: p.category,
  tagline: p.tagline,
  description: p.description,
  details: p.details,
  priceCents: p.priceCents,
  compareAtCents: p.compareAtCents,
  images: p.images.length ? p.images : ["/images/produit-echarpe.webp"],
  videos: p.videos?.length ? p.videos : undefined,
  sizes: p.sizes.length ? p.sizes : undefined,
  isNew: p.isNew,
  stock: p.trackStock ? Object.fromEntries((p.sizes.length ? p.sizes : [NO_SIZE]).map((s) => [s, Math.max(p.stock[s] ?? 0, 0)])) : undefined,
});

export async function getPublicCatalog(): Promise<ShopCatalog> {
  const [rows, cfg] = await Promise.all([productsDb.all(), shopConfig.get()]);
  const active = rows.filter((p) => p.status === "active").sort((a, b) => a.order - b.order);
  const cats = [...cfg.categories, ...new Set(active.map((p) => p.category))].filter((c, i, all) => all.indexOf(c) === i && active.some((p) => p.category === c));
  return { products: active.map(toPublic), rules: { standardCents: cfg.shipping.standardCents, freeFromCents: cfg.shipping.freeFromCents }, categories: cats };
}

export async function getProductPublic(id: string) {
  const p = await productsDb.get(id);
  return p && p.status === "active" ? toPublic(p) : null;
}

/** Retire du stock les quantités de la commande, atomiquement. Échoue sans rien modifier si un article manque. */
export async function reserveStock(lines: Array<Pick<OrderLine, "productId" | "size" | "qty">>): Promise<{ ok: true } | { ok: false; error: string }> {
  let result: { ok: true } | { ok: false; error: string } = { ok: true };
  await productsDb.mutate((rows) => {
    const next = rows.map((r) => ({ ...r, stock: { ...r.stock } }));
    for (const l of lines) {
      const p = next.find((x) => x.id === l.productId);
      if (!p || !p.trackStock) continue;
      const k = stockKey(l.size);
      if ((p.stock[k] ?? 0) < l.qty) {
        result = { ok: false, error: `« ${p.name}${l.size ? ` (${l.size})` : ""} » n'est plus disponible en quantité suffisante.` };
        return rows;
      }
    }
    for (const l of lines) {
      const p = next.find((x) => x.id === l.productId);
      if (p?.trackStock) p.stock[stockKey(l.size)] -= l.qty;
    }
    return next;
  });
  return result;
}

/** Remet en stock (commande annulée, remboursée ou expirée). */
export async function releaseStock(lines: Array<Pick<OrderLine, "productId" | "size" | "qty">>) {
  await productsDb.mutate((rows) =>
    rows.map((r) => {
      const mine = lines.filter((l) => l.productId === r.id);
      if (!mine.length || !r.trackStock) return r;
      const stock = { ...r.stock };
      for (const l of mine) stock[stockKey(l.size)] = (stock[stockKey(l.size)] ?? 0) + l.qty;
      return { ...r, stock };
    }),
  );
}

export const totalStock = (p: Product) => (p.trackStock ? Object.values(p.stock).reduce((a, b) => a + Math.max(b, 0), 0) : Infinity);

/* ---------- Codes promotionnels ---------- */

export type PromoResult = { ok: true; discountCents: number; promo: PromoCode } | { ok: false; error: string };

/** Contexte d'un achat pour évaluer un code : lignes (avec leur catégorie), acheteuse et adresse e-mail. */
export interface PromoContext {
  subtotalCents: number;
  lines?: Array<{ productId: string; category: string; totalCents: number }>;
  member?: { memberNumber: string; state: string; joinedAt: string } | null;
  email?: string;
}

/**
 * Valide un code promotionnel et calcule la réduction, TOUJOURS côté serveur. Conditions gérées : actif, période, périmètre (boutique,
 * événements, adhésion), nombre d'utilisations total et par compte, panier minimum, réduction maximum, produits ou catégories éligibles
 * (une réduction n'est jamais appliquée à un produit non éligible), réservé aux adhérentes, réservé aux nouvelles adhérentes.
 */
export async function checkPromo(code: string | undefined, scope: "shop" | "event" | "adhesion", ctxOrBase: number | PromoContext): Promise<PromoResult | null> {
  const c = code?.trim().toUpperCase().replace(/\s+/g, "");
  if (!c) return null;
  const ctx: PromoContext = typeof ctxOrBase === "number" ? { subtotalCents: ctxOrBase } : ctxOrBase;
  const baseCents = ctx.subtotalCents;
  const promo = await promoCodes.findOne((p) => p.code === c);
  const today = new Date().toISOString().slice(0, 10);
  if (!promo || !promo.active) return { ok: false, error: "Code promotionnel invalide." };
  if (promo.scope !== "all" && promo.scope !== scope) return { ok: false, error: "Ce code ne s'applique pas à cet achat." };
  if ((promo.startsAt && promo.startsAt > today) || (promo.endsAt && promo.endsAt < today)) return { ok: false, error: "Ce code n'est plus valable." };
  if (promo.maxUses && promo.uses >= promo.maxUses) return { ok: false, error: "Ce code a atteint son nombre maximum d'utilisations." };
  if (promo.minCents && baseCents < promo.minCents) return { ok: false, error: `Ce code s'applique à partir de ${(promo.minCents / 100).toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 2 })} € d'achats.` };
  if (promo.membersOnly && ctx.member?.state !== "active") return { ok: false, error: "Ce code est réservé aux adhérentes (connectez-vous avec une adhésion active)." };
  if (promo.newMembersOnly && (!ctx.member || ctx.member.state !== "active" || Date.now() - new Date(ctx.member.joinedAt).getTime() > 30 * 86_400_000)) return { ok: false, error: "Ce code est réservé aux nouvelles adhérentes." };
  if (promo.perUserLimit) {
    const email = ctx.email?.trim().toLowerCase();
    const used = (await listOrders()).filter((o) => o.promoCode === promo.code && o.status !== "cancelled" && o.status !== "failed" && ((ctx.member && o.memberNumber === ctx.member.memberNumber) || (email && o.contact.email.toLowerCase() === email))).length;
    if (used >= promo.perUserLimit) return { ok: false, error: "Vous avez déjà utilisé ce code le nombre de fois autorisé." };
  }
  // Base de calcul : seulement les articles éligibles quand le code est limité à des produits ou catégories.
  let eligibleCents = baseCents;
  const restricted = Boolean(promo.categories?.length || promo.productIds?.length);
  if (restricted && ctx.lines) {
    eligibleCents = ctx.lines.filter((l) => promo.productIds?.includes(l.productId) || promo.categories?.includes(l.category)).reduce((n, l) => n + l.totalCents, 0);
    if (eligibleCents <= 0) return { ok: false, error: "Ce code ne s'applique à aucun article de votre panier." };
  } else if (restricted) {
    return { ok: false, error: "Ce code ne s'applique qu'à certains produits de la boutique." };
  }
  let raw = promo.type === "percent" ? Math.round((eligibleCents * promo.value) / 100) : promo.value;
  if (promo.maxDiscountCents) raw = Math.min(raw, promo.maxDiscountCents);
  return { ok: true, discountCents: Math.min(Math.max(raw, 0), eligibleCents), promo };
}

export const consumePromo = (promo: PromoCode) => promoCodes.update(promo.id, { uses: promo.uses + 1 });
/** Libère l'utilisation d'un code quand la commande est annulée ou expirée sans avoir été payée. */
export const releasePromo = async (code: string) => {
  const promo = await promoCodes.findOne((p) => p.code === code);
  if (promo && promo.uses > 0) await promoCodes.update(promo.id, { uses: promo.uses - 1 });
};
