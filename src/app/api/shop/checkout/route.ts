import { validateCheckout, type CheckoutInput, type Order, type OrderLine } from "@/lib/orders";
import { type Membership, currentMembership, defaultPlan, membershipState, paymentOfMembership, renewMembership } from "@/lib/server/business";
import { json, throttled, readJson } from "@/lib/server/http";
import { paymentConfigured } from "@/lib/server/helloasso";
import { logEvent } from "@/lib/server/log";
import { startShopPayment } from "@/lib/server/checkout";
import { getSession } from "@/lib/server/session";
import { checkPromo, consumePromo, productsDb, releaseStock, reserveStock, shopConfig } from "@/lib/server/shop";
import { addOrder, getMemberByNumber, toPublic, updateOrder } from "@/lib/server/store";

/**
 * POST /api/checkout (alias de /api/shop/checkout) : création de commande, accessible aux invités comme aux membres connectées.
 * Le navigateur n'envoie que des identifiants et des quantités (et un code promo) : prix, stocks, livraison, réductions, adhésion et
 * total sont TOUJOURS recalculés ici à partir de la base, jamais depuis le navigateur.
 *
 * Étapes : identification > recalcul complet du panier > contrôle des stocks (réservation atomique) > validation du code promo >
 * commande locale « en attente de paiement » (numéro DDP-AAAA-NNNNN, lignes copiées avec nom et prix du moment) > intention de paiement
 * HelloAsso > enregistrement de l'identifiant de paiement.
 * Commande mixte : une membre connectée peut ajouter son adhésion (ou son renouvellement) à sa commande : un seul paiement.
 */
export async function POST(req: Request) {
  if (await throttled(req, "checkout", 20)) return json({ error: "Trop de tentatives. Réessayez dans quelques minutes." }, 429);
  const input = await readJson<Partial<CheckoutInput> & { includeMembership?: boolean }>(req);
  if (!input || !Array.isArray(input.items) || input.items.length > 30) return json({ error: "Panier vide ou invalide." }, 400);
  const wantsMembership = input.includeMembership === true;
  if (input.items.length === 0 && !wantsMembership) return json({ error: "Panier vide ou invalide." }, 400);

  const errors = validateCheckout(input);
  if (Object.keys(errors).length) return json({ error: "Certains champs sont à corriger.", errors }, 422);

  const [rows, cfg, session] = await Promise.all([productsDb.all(), shopConfig.get(), getSession()]);
  const lines: OrderLine[] = [];
  const cats = new Map<string, string>();
  for (const item of input.items) {
    const p = rows.find((x) => x.id === String(item.productId) && x.status === "active");
    const qty = Number(item.qty);
    if (!p || !Number.isInteger(qty) || qty < 1 || qty > 10) return json({ error: "Un article du panier n'est plus disponible." }, 400);
    if (p.sizes.length && (!item.size || !p.sizes.includes(item.size))) return json({ error: `Choisissez une taille pour « ${p.name} ».` }, 400);
    lines.push({ productId: p.id, name: p.name, size: p.sizes.length ? item.size : undefined, qty, unitCents: p.priceCents });
    cats.set(p.id, p.category);
  }

  // Adhésion ajoutée à la commande (membres connectées uniquement, adhésion non active).
  const stored = session?.role === "member" ? await getMemberByNumber(session.memberNumber) : null;
  const memberState = stored ? await membershipState(stored.id) : null;
  if (wantsMembership) {
    if (!stored) return json({ error: "Connectez-vous pour ajouter votre adhésion à la commande." }, 401);
    if (memberState === "active") return json({ error: "Votre adhésion est déjà active." }, 409);
    if (memberState === "suspended" || memberState === "expelled") return json({ error: "Votre compte ne peut pas adhérer pour le moment : contactez l'association." }, 403);
    if (!(await defaultPlan())) return json({ error: "Aucune formule d'adhésion n'est disponible pour le moment." }, 503);
  }

  const mode = lines.length ? input.delivery!.mode : "event";
  const productsCents = lines.reduce((n, l) => n + l.unitCents * l.qty, 0);
  const promo = await checkPromo(input.promoCode, "shop", {
    subtotalCents: productsCents,
    lines: lines.map((l) => ({ productId: l.productId, category: cats.get(l.productId) ?? "", totalCents: l.unitCents * l.qty })),
    member: stored ? { memberNumber: stored.memberNumber, state: memberState ?? "none", joinedAt: stored.joinedAt } : null,
    email: input.contact!.email,
  });
  if (promo && !promo.ok) return json({ error: promo.error, errors: { promoCode: promo.error } }, 422);
  const discountCents = promo?.ok ? promo.discountCents : 0;
  const shippingCents = !lines.length || mode === "event" || productsCents - discountCents >= cfg.shipping.freeFromCents ? 0 : cfg.shipping.standardCents;

  const reserved = await reserveStock(lines);
  if (!reserved.ok) return json({ error: reserved.error }, 409);

  // Adhésion : réutilise l'adhésion en attente de règlement, sinon crée le renouvellement (à régler avec la commande).
  let membershipLine: Order["membership"];
  if (wantsMembership && stored) {
    let ms: Membership | null = await currentMembership(stored.id);
    if (memberState !== "pending" || !ms) ms = await renewMembership(toPublic(stored));
    const pay = ms ? await paymentOfMembership(ms.id) : null;
    if (!ms || !pay) {
      await releaseStock(lines);
      return json({ error: "Adhésion impossible pour le moment." }, 503);
    }
    membershipLine = { planId: ms.planId, planName: `${ms.planName} ${ms.season}`, amountCents: pay.amountCents, membershipId: ms.id, paymentId: pay.id };
  }

  const order = await addOrder({
    status: "awaiting_payment",
    lines,
    subtotalCents: productsCents + (membershipLine?.amountCents ?? 0),
    shippingCents,
    totalCents: productsCents - discountCents + shippingCents + (membershipLine?.amountCents ?? 0),
    discountCents: discountCents || undefined,
    promoCode: promo?.ok ? promo.promo.code : undefined,
    membership: membershipLine,
    attempts: 0,
    contact: {
      email: input.contact!.email.trim().toLowerCase(),
      firstName: input.contact!.firstName.trim(),
      lastName: input.contact!.lastName.trim(),
      phone: input.contact!.phone?.trim() || undefined,
    },
    delivery: { mode, address: mode === "home" ? input.delivery!.address : undefined },
    memberNumber: stored?.memberNumber,
  });
  if (promo?.ok) await consumePromo(promo.promo);

  if (!paymentConfigured()) {
    return json({ orderId: order.id, orderNumber: order.orderNumber, token: order.token, paymentEnabled: false, message: "Commande enregistrée. Le paiement en ligne n'est pas encore activé : elle reste en attente de règlement." }, 201);
  }

  try {
    const checkout = await startShopPayment(req, order);
    await updateOrder(order.id, { checkoutId: checkout.id, attempts: 1 });
    logEvent("checkout_created", { orderId: order.id, orderNumber: order.orderNumber, totalCents: order.totalCents, checkoutIntentId: checkout.id, membership: Boolean(membershipLine) });
    return json({ orderId: order.id, orderNumber: order.orderNumber, token: order.token, paymentEnabled: true, checkoutUrl: checkout.url }, 201);
  } catch (e) {
    // Le paiement n'a pas pu démarrer : la commande reste en attente (nouvel essai possible), le stock reste réservé jusqu'à son annulation ou son expiration.
    logEvent("checkout_failed", { orderId: order.id, orderNumber: order.orderNumber, error: e instanceof Error ? e.message : "erreur" }, "error");
    return json({ orderId: order.id, orderNumber: order.orderNumber, token: order.token, paymentEnabled: false, retryable: true, message: "Commande enregistrée, mais le paiement n'a pas pu être initialisé. Vous pouvez réessayer." }, 201);
  }
}
