"use server";

import { safeUrl } from "@/lib/safe-url";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Fulfilment } from "@/lib/orders";
import { NO_SIZE } from "@/lib/shop";
import { audit, requireAdmin } from "@/lib/server/admin-auth";
import { slugify } from "@/lib/server/content";
import { sendTemplate } from "@/lib/server/email";
import { mediaUrl, saveMedia } from "@/lib/server/media";
import { productsDb, shopConfig, type Product, type ProductStatus } from "@/lib/server/shop";
import { getOrder, listOrders, updateOrder } from "@/lib/server/store";

const s = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
const lines = (v: string) => v.split("\n").map((x) => x.trim()).filter(Boolean);
const refresh = () => {
  revalidatePath("/boutique", "layout");
  revalidatePath("/", "layout");
};
const euros = (v: string) => {
  const n = Math.round(parseFloat(v.replace(",", ".")) * 100);
  return Number.isFinite(n) && n >= 0 ? n : 0;
};

export async function saveProductAction(formData: FormData) {
  const ctx = await requireAdmin("shop.edit");
  const editing = s(formData, "id");
  const before = editing ? await productsDb.get(editing) : null;
  const back = (m: string) => redirect(`${editing ? `/admin/boutique/${editing}` : "/admin/boutique/nouveau"}?erreur=${encodeURIComponent(m)}`);
  const name = s(formData, "name");
  if (!name) back("Le nom est requis.");

  const images = lines(s(formData, "images")).map(safeUrl).filter(Boolean);
  for (const f of formData.getAll("imageFiles")) {
    if (!(f instanceof File) || f.size === 0) continue;
    const up = await saveMedia(f);
    if (!up.ok) back(up.error);
    else images.push(mediaUrl(up.media));
  }
  const sizes = s(formData, "sizes").split(",").map((x) => x.trim()).filter(Boolean);
  const data: Omit<Product, "id" | "createdAt" | "updatedAt"> = {
    name,
    category: s(formData, "category") || before?.category || "Accessoires",
    tagline: s(formData, "tagline"),
    description: s(formData, "description"),
    details: lines(s(formData, "details")),
    images,
    sizes,
    isNew: formData.get("isNew") === "on",
    status: (s(formData, "status") || "draft") as ProductStatus,
    order: Number(s(formData, "order")) || before?.order || 99,
    sku: s(formData, "sku") || undefined,
    // Prix et stocks : conservés tels quels sans les permissions correspondantes
    priceCents: before?.priceCents ?? 0,
    compareAtCents: before?.compareAtCents,
    trackStock: before?.trackStock ?? true,
    stock: before?.stock ?? {},
  };
  if (ctx.can("shop.pricing")) {
    data.priceCents = euros(s(formData, "price"));
    data.compareAtCents = s(formData, "compareAt") ? euros(s(formData, "compareAt")) : undefined;
  }
  if (ctx.can("shop.stock")) {
    data.trackStock = formData.get("trackStock") === "on";
    data.stock = Object.fromEntries((sizes.length ? sizes : [NO_SIZE]).map((z) => [z, Math.max(Number(s(formData, `stock:${z}`)) || 0, 0)]));
  } else if (sizes.length) {
    data.stock = Object.fromEntries(sizes.map((z) => [z, before?.stock[z] ?? 0]));
  }
  if (!editing && !ctx.can("shop.pricing")) data.status = "draft";
  if (data.status === "active" && data.priceCents <= 0) back("Un produit en vente doit avoir un prix : demandez à une personne autorisée à fixer les prix.");

  if (editing && before) {
    await productsDb.update(editing, { ...data, origin: before.origin });
    await audit(ctx, "modification", "produit", `Produit modifié : ${name}`, { entityId: editing, before: { price: before.priceCents, status: before.status, stock: before.stock }, after: { price: data.priceCents, status: data.status, stock: data.stock } });
    refresh();
    redirect(`/admin/boutique/${editing}?ok=${encodeURIComponent("Produit enregistré.")}`);
  }
  let id = slugify(s(formData, "slug") || name);
  while (await productsDb.get(id)) id = `${id}-${Math.random().toString(36).slice(2, 5)}`;
  await productsDb.insert({ id, ...data } as never);
  await audit(ctx, "création", "produit", `Produit créé : ${name}`, { entityId: id });
  refresh();
  redirect(`/admin/boutique/${id}?ok=${encodeURIComponent("Produit créé.")}`);
}

export async function setProductStatusAction(id: string, status: ProductStatus) {
  const ctx = await requireAdmin("shop.edit");
  const p = await productsDb.get(id);
  if (!p) redirect("/admin/boutique");
  if (status === "active" && p.priceCents <= 0) redirect(`/admin/boutique/${id}?erreur=${encodeURIComponent("Fixez d'abord un prix avant de mettre en vente.")}`);
  await productsDb.update(id, { status });
  await audit(ctx, "modification", "produit", `Produit « ${p.name} » : ${status}`, { entityId: id, before: p.status, after: status });
  refresh();
  redirect(`/admin/boutique/${id}?ok=${encodeURIComponent("Statut mis à jour.")}`);
}

export async function deleteProductAction(id: string) {
  const ctx = await requireAdmin("shop.edit");
  const p = await productsDb.get(id);
  if (!p) redirect("/admin/boutique");
  const used = (await listOrders()).some((o) => o.lines.some((l) => l.productId === id));
  if (used) {
    await productsDb.update(id, { status: "archived" });
    await audit(ctx, "archivage", "produit", `Produit archivé (déjà commandé) : ${p.name}`, { entityId: id });
    refresh();
    redirect("/admin/boutique?ok=" + encodeURIComponent("Ce produit a déjà été commandé : il est archivé plutôt que supprimé."));
  }
  await productsDb.remove(id);
  await audit(ctx, "suppression", "produit", `Produit supprimé : ${p.name}`, { entityId: id });
  refresh();
  redirect("/admin/boutique?ok=" + encodeURIComponent("Produit supprimé."));
}

/** Mise à jour rapide des quantités d'un produit depuis la page Stock. */
export async function updateStockAction(id: string, formData: FormData) {
  const ctx = await requireAdmin("shop.stock");
  const p = await productsDb.get(id);
  if (!p) redirect("/admin/boutique/stock");
  const keys = p.sizes.length ? p.sizes : [NO_SIZE];
  const stock = Object.fromEntries(keys.map((k) => [k, Math.max(Number(s(formData, `stock:${k}`)) || 0, 0)]));
  await productsDb.update(id, { stock, trackStock: true });
  await audit(ctx, "stock", "produit", `Stock de « ${p.name} » modifié`, { entityId: id, before: p.stock, after: stock });
  refresh();
  redirect(`/admin/boutique/stock?ok=${encodeURIComponent(`Stock de « ${p.name} » enregistré.`)}`);
}

export async function saveShopSettingsAction(formData: FormData) {
  const ctx = await requireAdmin("shop.pricing");
  const before = await shopConfig.get();
  const next = {
    shipping: { standardCents: euros(s(formData, "standard")), freeFromCents: euros(s(formData, "freeFrom")) },
    lowStock: Math.max(Number(s(formData, "lowStock")) || 0, 0),
    categories: s(formData, "categories").split(",").map((c) => c.trim()).filter(Boolean),
  };
  await shopConfig.set(next);
  await audit(ctx, "modification", "boutique", "Réglages de la boutique modifiés", { before, after: next });
  refresh();
  redirect("/admin/boutique/reglages?ok=" + encodeURIComponent("Réglages enregistrés."));
}

/* ---------- Commandes ---------- */

export async function setFulfilmentAction(orderId: string, status: Fulfilment, formData: FormData) {
  const ctx = await requireAdmin("shop.orders");
  const order = await getOrder(orderId);
  const back = (kind: "ok" | "erreur", m: string) => redirect(`/admin/boutique/commandes/${orderId}?${kind}=${encodeURIComponent(m)}`);
  if (!order) redirect("/admin/boutique/commandes");
  if (order.status !== "paid") back("erreur", "La commande doit être réglée avant d'être préparée ou expédiée.");
  const tracking = s(formData, "tracking") || order.tracking;
  const carrier = s(formData, "carrier") || order.carrier;
  await updateOrder(orderId, { fulfilment: status, tracking, carrier });
  await audit(ctx, "commande", "commande", `Commande ${orderId.slice(0, 8).toUpperCase()} : ${status}`, { entityId: orderId, before: order.fulfilment, after: status });
  const vars = { prenom: order.contact.firstName, objet: orderId.slice(0, 8).toUpperCase(), suivi: [carrier, tracking].filter(Boolean).join(" ") || "aucun numéro de suivi" };
  if (status === "shipped" && order.fulfilment !== "shipped") await sendTemplate("order_shipped", order.contact.email, vars);
  if (status === "ready_for_pickup" && order.fulfilment !== "ready_for_pickup") await sendTemplate("order_ready", order.contact.email, vars);
  refresh();
  back("ok", "Suivi de la commande mis à jour.");
}

export async function saveOrderNoteAction(orderId: string, formData: FormData) {
  const ctx = await requireAdmin("shop.orders");
  await updateOrder(orderId, { note: s(formData, "note") || undefined });
  await audit(ctx, "commande", "commande", `Note ajoutée à la commande ${orderId.slice(0, 8).toUpperCase()}`, { entityId: orderId });
  redirect(`/admin/boutique/commandes/${orderId}?ok=${encodeURIComponent("Note enregistrée.")}`);
}

