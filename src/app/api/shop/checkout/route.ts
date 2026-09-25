import { getProduct, shipping } from "@/data/shop";
import { validateCheckout, type CheckoutInput, type OrderLine } from "@/lib/orders";
import { json, siteUrl, throttled } from "@/lib/server/http";
import { getSession } from "@/lib/server/session";
import { addOrder, updateOrder } from "@/lib/server/store";
import { createShopCheckoutSession, stripeConfigured } from "@/lib/server/stripe";

/**
 * Création de commande : accessible aux invités comme aux membres connectées (achat rapide).
 * Les prix sont TOUJOURS recalculés ici à partir du catalogue, jamais depuis le navigateur.
 */
export async function POST(req: Request) {
  if (throttled(req, "checkout", 20)) return json({ error: "Trop de tentatives. Réessayez dans quelques minutes." }, 429);
  const input = (await req.json().catch(() => null)) as Partial<CheckoutInput> | null;
  if (!input || !Array.isArray(input.items) || input.items.length === 0 || input.items.length > 30) return json({ error: "Panier vide ou invalide." }, 400);

  const errors = validateCheckout(input);
  if (Object.keys(errors).length) return json({ error: "Certains champs sont à corriger.", errors }, 422);

  const lines: OrderLine[] = [];
  for (const item of input.items) {
    const p = getProduct(String(item.productId));
    const qty = Number(item.qty);
    if (!p || !Number.isInteger(qty) || qty < 1 || qty > 10) return json({ error: "Un article du panier est invalide." }, 400);
    if (p.sizes && (!item.size || !p.sizes.includes(item.size))) return json({ error: `Choisissez une taille pour « ${p.name} ».` }, 400);
    lines.push({ productId: p.id, name: p.name, size: p.sizes ? item.size : undefined, qty, unitCents: p.priceCents });
  }

  const mode = input.delivery!.mode;
  const subtotalCents = lines.reduce((n, l) => n + l.unitCents * l.qty, 0);
  const shippingCents = mode === "event" || subtotalCents >= shipping.freeFromCents ? 0 : shipping.standardCents;
  const session = await getSession();

  const order = await addOrder({
    status: "awaiting_payment",
    lines,
    subtotalCents,
    shippingCents,
    totalCents: subtotalCents + shippingCents,
    contact: {
      email: input.contact!.email.trim().toLowerCase(),
      firstName: input.contact!.firstName.trim(),
      lastName: input.contact!.lastName.trim(),
      phone: input.contact!.phone?.trim() || undefined,
    },
    delivery: { mode, address: mode === "home" ? input.delivery!.address : undefined },
    memberNumber: session?.role === "member" ? session.memberNumber : undefined,
  });

  if (!stripeConfigured()) {
    return json({ orderId: order.id, token: order.token, paymentEnabled: false, message: "Commande enregistrée. Le paiement en ligne n'est pas encore activé : elle reste en attente de règlement." }, 201);
  }

  try {
    const stripeLines = lines.map((l) => ({ name: l.size ? `${l.name} (${l.size})` : l.name, unitAmountCents: l.unitCents, quantity: l.qty }));
    if (shippingCents > 0) stripeLines.push({ name: "Livraison standard", unitAmountCents: shippingCents, quantity: 1 });
    const checkout = await createShopCheckoutSession({ orderId: order.id, token: order.token, lines: stripeLines, customerEmail: order.contact.email, siteUrl: siteUrl(req) });
    await updateOrder(order.id, { stripeSessionId: checkout.id });
    return json({ orderId: order.id, token: order.token, paymentEnabled: true, checkoutUrl: checkout.url }, 201);
  } catch {
    return json({ orderId: order.id, token: order.token, paymentEnabled: false, message: "Commande enregistrée, mais le paiement n'a pas pu être initialisé." }, 201);
  }
}
