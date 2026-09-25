import { validateCheckout, type CheckoutInput, type OrderLine } from "@/lib/orders";
import { json, siteUrl, throttled } from "@/lib/server/http";
import { getSession } from "@/lib/server/session";
import { checkPromo, consumePromo, productsDb, reserveStock, shopConfig } from "@/lib/server/shop";
import { addOrder, updateOrder } from "@/lib/server/store";
import { createShopCheckoutSession, stripeConfigured } from "@/lib/server/stripe";

/**
 * Création de commande : accessible aux invités comme aux membres connectées (achat rapide).
 * Prix, stocks, livraison et réductions sont TOUJOURS recalculés ici à partir de la base, jamais depuis le navigateur.
 */
export async function POST(req: Request) {
  if (throttled(req, "checkout", 20)) return json({ error: "Trop de tentatives. Réessayez dans quelques minutes." }, 429);
  const input = (await req.json().catch(() => null)) as Partial<CheckoutInput> | null;
  if (!input || !Array.isArray(input.items) || input.items.length === 0 || input.items.length > 30) return json({ error: "Panier vide ou invalide." }, 400);

  const errors = validateCheckout(input);
  if (Object.keys(errors).length) return json({ error: "Certains champs sont à corriger.", errors }, 422);

  const [rows, cfg] = await Promise.all([productsDb.all(), shopConfig.get()]);
  const lines: OrderLine[] = [];
  for (const item of input.items) {
    const p = rows.find((x) => x.id === String(item.productId) && x.status === "active");
    const qty = Number(item.qty);
    if (!p || !Number.isInteger(qty) || qty < 1 || qty > 10) return json({ error: "Un article du panier n'est plus disponible." }, 400);
    if (p.sizes.length && (!item.size || !p.sizes.includes(item.size))) return json({ error: `Choisissez une taille pour « ${p.name} ».` }, 400);
    lines.push({ productId: p.id, name: p.name, size: p.sizes.length ? item.size : undefined, qty, unitCents: p.priceCents });
  }

  const mode = input.delivery!.mode;
  const subtotalCents = lines.reduce((n, l) => n + l.unitCents * l.qty, 0);
  const promo = await checkPromo(input.promoCode, "shop", subtotalCents);
  if (promo && !promo.ok) return json({ error: promo.error, errors: { promoCode: promo.error } }, 422);
  const discountCents = promo?.ok ? promo.discountCents : 0;
  const shippingCents = mode === "event" || subtotalCents - discountCents >= cfg.shipping.freeFromCents ? 0 : cfg.shipping.standardCents;

  const reserved = await reserveStock(lines);
  if (!reserved.ok) return json({ error: reserved.error }, 409);

  const session = await getSession();
  const order = await addOrder({
    status: "awaiting_payment",
    lines,
    subtotalCents,
    shippingCents,
    totalCents: subtotalCents - discountCents + shippingCents,
    discountCents: discountCents || undefined,
    promoCode: promo?.ok ? promo.promo.code : undefined,
    contact: {
      email: input.contact!.email.trim().toLowerCase(),
      firstName: input.contact!.firstName.trim(),
      lastName: input.contact!.lastName.trim(),
      phone: input.contact!.phone?.trim() || undefined,
    },
    delivery: { mode, address: mode === "home" ? input.delivery!.address : undefined },
    memberNumber: session?.role === "member" ? session.memberNumber : undefined,
  });
  if (promo?.ok) await consumePromo(promo.promo);

  if (!stripeConfigured()) {
    return json({ orderId: order.id, token: order.token, paymentEnabled: false, message: "Commande enregistrée. Le paiement en ligne n'est pas encore activé : elle reste en attente de règlement." }, 201);
  }

  try {
    const stripeLines = lines.map((l) => ({ name: l.size ? `${l.name} (${l.size})` : l.name, unitAmountCents: l.unitCents, quantity: l.qty }));
    if (shippingCents > 0) stripeLines.push({ name: "Livraison standard", unitAmountCents: shippingCents, quantity: 1 });
    const checkout = await createShopCheckoutSession({ orderId: order.id, token: order.token, lines: stripeLines, discountCents, discountLabel: promo?.ok ? promo.promo.code : undefined, customerEmail: order.contact.email, siteUrl: siteUrl(req) });
    await updateOrder(order.id, { stripeSessionId: checkout.id });
    return json({ orderId: order.id, token: order.token, paymentEnabled: true, checkoutUrl: checkout.url }, 201);
  } catch {
    // Le paiement n'a pas pu démarrer : la commande reste en attente, le stock reste réservé jusqu'à son annulation ou son expiration.
    return json({ orderId: order.id, token: order.token, paymentEnabled: false, message: "Commande enregistrée, mais le paiement n'a pas pu être initialisé." }, 201);
  }
}

