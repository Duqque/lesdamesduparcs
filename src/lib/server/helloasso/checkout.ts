import "server-only";
import { haFetch, HelloAssoError } from "./client";
import { helloAssoConfig } from "./config";
import type { Checkout, CheckoutState, PaymentKind } from "./types";

/**
 * Crée une intention de paiement (Checkout API : POST /organizations/{slug}/checkout-intents).
 * Le montant est TOUJOURS celui calculé par le serveur (réductions déjà déduites). La référence de l'enregistrement interne est jointe
 * en `metadata` (renvoyée dans les notifications) pour retrouver la commande. L'adresse de redirection est valable 15 minutes.
 */
export async function createCheckoutIntent(opts: {
  kind: PaymentKind;
  refId: string;
  itemName: string;
  totalCents: number;
  payer: { firstName: string; lastName: string; email: string };
  returnUrl: string;
  backUrl: string;
  errorUrl: string;
  /** Informations utiles au rapprochement (numéro de commande, membre…) : jamais de donnée sensible. */
  extra?: Record<string, string | number | undefined>;
}): Promise<Checkout> {
  if (!Number.isInteger(opts.totalCents) || opts.totalCents < 1) throw new Error("Montant invalide.");
  const c = helloAssoConfig();
  const type = opts.kind === "order" ? "SHOP_ORDER" : opts.kind === "membership" ? "MEMBERSHIP" : "EVENT_REGISTRATION";
  const body = {
    totalAmount: opts.totalCents,
    initialAmount: opts.totalCents,
    itemName: opts.itemName.slice(0, 250),
    backUrl: opts.backUrl,
    errorUrl: opts.errorUrl,
    returnUrl: opts.returnUrl,
    containsDonation: false,
    payer: { firstName: opts.payer.firstName.slice(0, 80), lastName: opts.payer.lastName.slice(0, 80), email: opts.payer.email },
    metadata: { kind: opts.kind, ref: opts.refId, type, env: c.env, ...opts.extra },
  };
  const post = (b: object) => haFetch<{ id?: number; redirectUrl?: string }>(`/organizations/${encodeURIComponent(c.organizationSlug)}/checkout-intents`, { method: "POST", body: b });
  let data: { id?: number; redirectUrl?: string };
  try {
    data = await post(body);
  } catch (e) {
    // HelloAsso valide strictement le payeur (pas de chiffre, prénom différent du nom…) : plutôt que de bloquer le paiement,
    // on relance sans pré-remplir le payeur, qui saisira son nom sur la page HelloAsso.
    if (!(e instanceof HelloAssoError && e.status === 400)) throw logCheckoutError(e, opts);
    console.warn(`[HelloAsso] Payeur refusé (${e.message}) : nouvelle tentative sans pré-remplir le payeur (${opts.kind} ${opts.refId}).`);
    try {
      data = await post({ ...body, payer: undefined });
    } catch (e2) {
      throw logCheckoutError(e2, opts);
    }
  }
  if (!data.id || !data.redirectUrl) throw logCheckoutError(new HelloAssoError("Réponse HelloAsso incomplète.", 502), opts);
  return { id: String(data.id), url: data.redirectUrl };
}

/** Écrit la vraie réponse de HelloAsso dans le journal du serveur (jamais de donnée personnelle), puis renvoie l'erreur. */
function logCheckoutError(e: unknown, opts: { kind: PaymentKind; refId: string }) {
  const c = helloAssoConfig();
  const detail = e instanceof HelloAssoError ? `HTTP ${e.status}${e.code ? ` ${e.code}` : ""} : ${e.message}` : e instanceof Error ? e.message : String(e);
  console.error(`[HelloAsso] Création du paiement impossible (${c.env}, organisation « ${c.organizationSlug} », ${opts.kind} ${opts.refId}) — ${detail}`);
  return e;
}

/** Relit l'intention de paiement chez HelloAsso : seule source de vérité (jamais l'adresse de retour ni le corps d'une notification). */
export async function retrieveCheckout(id: string): Promise<CheckoutState> {
  if (!/^\d{1,20}$/.test(id)) throw new Error("Identifiant de paiement invalide.");
  const data = await haFetch<CheckoutState>(`/organizations/${encodeURIComponent(helloAssoConfig().organizationSlug)}/checkout-intents/${id}`);
  return { ...data, id };
}

/** Paiement encaissé et rapproché : commande créée, paiement « Authorized », montants identiques (pourboire HelloAsso exclu). */
export function paidAmount(c: CheckoutState): number | null {
  const pay = c.order?.payments?.find((p) => p.state === "Authorized");
  if (!c.order || !pay || typeof pay.amount !== "number") return null;
  const net = pay.amount - (pay.amountTip ?? 0);
  if (typeof c.order.amount?.total === "number" && c.order.amount.total !== net) return null;
  return net;
}

/** Paiement refusé par la banque (état « Refused ») : la commande peut être marquée « échouée » et re-tentée. */
export const isRefused = (c: CheckoutState) => Boolean(c.order?.payments?.some((p) => p.state === "Refused")) && paidAmount(c) === null;

/**
 * Remboursement constaté chez HelloAsso : état « Refunded » (ou « Refunding »), avec les opérations traitées quand elles sont fournies.
 * `partial` : le montant remboursé est inférieur au paiement.
 */
export function refundState(c: CheckoutState): { refunded: boolean; partial: boolean; refundedCents: number } {
  const r = c.order?.payments?.find((p) => p.state === "Refunded" || p.state === "Refunding");
  if (!r) return { refunded: false, partial: false, refundedCents: 0 };
  const ops = (r.refundOperations ?? []).filter((o) => !o.status || o.status === "PROCESSED");
  const refundedCents = ops.length ? ops.reduce((n, o) => n + (o.amount ?? 0), 0) : (r.amount ?? 0);
  return { refunded: true, partial: typeof r.amount === "number" && refundedCents > 0 && refundedCents < r.amount, refundedCents };
}

/**
 * Remboursement via l'API : POST /payments/{id}/refund. ATTENTION (documentation HelloAsso) : ce point d'accès est protégé par une
 * authentification forte (MFA) ; sans les jetons MFA, HelloAsso répond par une erreur d'autorisation. Dans ce cas, le remboursement
 * se fait depuis l'espace HelloAsso : la notification « Payment / Refunded » qui suit met ensuite le site à jour.
 */
export async function refundPayment(checkoutId: string, opts?: { amountCents?: number; comment?: string }) {
  const c = await retrieveCheckout(checkoutId);
  const pay = c.order?.payments?.find((p) => p.state === "Authorized");
  if (!pay?.id) throw new Error("Aucun paiement encaissé à rembourser pour cette transaction.");
  const q = new URLSearchParams({ comment: opts?.comment ?? "Remboursement demandé par l'association", sendRefundMail: "true" });
  if (opts?.amountCents) q.set("amount", String(opts.amountCents));
  try {
    return await haFetch<{ id?: number; state?: string }>(`/payments/${pay.id}/refund?${q}`, { method: "POST" });
  } catch (e) {
    if (e instanceof HelloAssoError && (e.status === 403 || /mfa/i.test(e.code ?? "") || /mfa|authentification/i.test(e.message))) {
      throw new Error("HelloAsso demande une authentification forte (MFA) pour ce remboursement : effectuez-le depuis votre espace HelloAsso.");
    }
    throw e;
  }
}
