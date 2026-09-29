import { ADHESION_CAP_MESSAGE, type Membership, adhesionCapStatus, hasPaidMembership, membershipState, currentMembership, paymentOfMembership, payments, renewMembership } from "@/lib/server/business";
import { startMembershipPayment } from "@/lib/server/checkout";
import { paymentConfigured } from "@/lib/server/helloasso";
import { json, readJson, throttled, tooMany } from "@/lib/server/http";
import { markMembershipPaid, reconcile } from "@/lib/server/payments";
import { issueInvoice } from "@/lib/server/invoice";
import { getSession } from "@/lib/server/session";
import { checkPromo, consumePromo, releasePromo } from "@/lib/server/shop";
import { getMemberByNumber, toPublic } from "@/lib/server/store";

/**
 * Paiement (ou renouvellement) de l'adhésion de la membre connectée : crée l'adhésion de la saison en cours si besoin, applique un
 * éventuel code promotionnel (recalculé par le serveur), puis ouvre la page de paiement HelloAsso. Un code qui ramène le prix à 0 €
 * active directement l'adhésion. Le montant est TOUJOURS celui de la formule côté serveur.
 * Corps facultatif : { promoCode?: string, check?: true } (check : n'affiche que la réduction, sans lancer le paiement).
 */
export async function POST(req: Request) {
  const s = await getSession();
  if (s?.role !== "member") return json({ error: "Connectez-vous pour régler votre adhésion." }, 401);
  if (await throttled(req, "adhesion", 20, 3_600_000)) return tooMany();
  const body = (await readJson<{ promoCode?: string; check?: boolean }>(req)) ?? {};
  const stored = await getMemberByNumber(s.memberNumber);
  if (!stored) return json({ error: "Compte introuvable." }, 404);
  const member = toPublic(stored);

  const state = await membershipState(member.id);
  if (state === "active") return json({ error: "Votre adhésion est déjà active." }, 409);
  if (state === "suspended" || state === "expelled") return json({ error: "Votre compte ne peut pas adhérer pour le moment : contactez l'association." }, 403);
  // Plafond de la première vague : ne concerne jamais un renouvellement (adhérente ayant déjà réglé une adhésion, un jour).
  if (!(await hasPaidMembership(member.id)) && (await adhesionCapStatus()).blocked) return json({ error: ADHESION_CAP_MESSAGE }, 403);

  let ms: Membership | null = await currentMembership(member.id);
  if (state === "expired" || state === "none" || !ms) ms = await renewMembership(member);
  if (!ms) return json({ error: "Aucune formule d'adhésion n'est disponible pour le moment." }, 503);
  let pay = await paymentOfMembership(ms.id);
  if (!pay || pay.status === "paid") return json({ ok: true, state: "active" });

  // Code promotionnel (portée « adhésion ») : recalculé à partir du prix de la formule.
  const base = pay.baseCents ?? pay.amountCents;
  const promo = await checkPromo(body.promoCode, "adhesion", { subtotalCents: base, member: { memberNumber: member.memberNumber, state, joinedAt: member.joinedAt }, email: member.email });
  if (promo && !promo.ok) return json({ error: promo.error, errors: { promoCode: promo.error } }, 422);
  const discount = promo?.ok ? promo.discountCents : 0;
  const amount = base - discount;
  if (body.check) return json({ ok: true, baseCents: base, discountCents: discount, amountCents: amount, label: promo?.ok ? promo.promo.label || promo.promo.code : undefined });

  const newCode = promo?.ok ? promo.promo.code : undefined;
  if (pay.promoCode !== newCode) {
    if (pay.promoCode) await releasePromo(pay.promoCode);
    if (promo?.ok) await consumePromo(promo.promo);
  }
  await payments.update(pay.id, { baseCents: base, amountCents: amount, discountCents: discount || undefined, promoCode: newCode });
  pay = { ...pay, baseCents: base, amountCents: amount, discountCents: discount || undefined, promoCode: newCode };

  if (amount <= 0) {
    // Adhésion offerte par le code : activée sans paiement en ligne (méthode « Autre », jamais « Carte »), avec sa facture à 0 € (compte et e-mail).
    await markMembershipPaid(pay, { amountCents: 0, method: "autre" });
    await issueInvoice(`payment:${pay.id}`);
    return json({ ok: true, state: "active", free: true });
  }
  if (!paymentConfigured()) return json({ ok: true, state: "pending", offline: true, amountCents: amount, message: "Le paiement en ligne n'est pas encore disponible : réglez votre adhésion auprès de l'association (espèces, chèque…), elle validera votre carte." });

  // Un paiement déjà lancé (autre onglet, retour tardif) est d'abord relu chez HelloAsso : jamais de doublon pour une adhésion déjà réglée.
  if (pay.checkoutId) {
    try {
      const done = await reconcile("membership", pay.id);
      if (done === "paid" || done === "already") return json({ ok: true, state: "active" });
    } catch {
      /* HelloAsso injoignable : on propose un nouveau paiement */
    }
  }
  try {
    const checkout = await startMembershipPayment(req, pay, member);
    await payments.update(pay.id, { checkoutId: checkout.id, status: "pending", method: "online", deferredAt: undefined });
    return json({ ok: true, state: "pending", url: checkout.url, amountCents: amount });
  } catch {
    return json({ error: "Le paiement en ligne est momentanément indisponible. Réessayez dans quelques instants." }, 502);
  }
}
