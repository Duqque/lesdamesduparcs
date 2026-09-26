import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Paiement en ligne via HelloAsso (plateforme de paiement des associations) : le visiteur est redirigé vers la page de
 * paiement HelloAsso, le site ne manipule jamais de numéro de carte. Appels REST directs (API v5, OAuth2 « client credentials »).
 *
 * Variables d'environnement :
 *  HELLOASSO_CLIENT_ID, HELLOASSO_CLIENT_SECRET : identifiants API (espace HelloAsso > Intégrations et API)
 *  HELLOASSO_ORG_SLUG                           : identifiant de l'association dans l'adresse HelloAsso
 *  HELLOASSO_SANDBOX=1                          : environnement de test (api.helloasso-sandbox.com)
 *  HELLOASSO_WEBHOOK_SECRET                     : jeton secret inséré dans l'adresse de notification (obligatoire pour le webhook)
 *  HELLOASSO_SIGNATURE_KEY                      : clé de signature des notifications (facultative, vérifiée si présente)
 */
const env = (k: string) => process.env[k]?.trim() ?? "";
/** HELLOASSO_API_BASE : réservé aux tests automatisés (serveur factice) ; à ne jamais définir en production. */
const base = () => env("HELLOASSO_API_BASE") || (env("HELLOASSO_SANDBOX") === "1" ? "https://api.helloasso-sandbox.com" : "https://api.helloasso.com");

export const paymentConfigured = () => Boolean(env("HELLOASSO_CLIENT_ID") && env("HELLOASSO_CLIENT_SECRET") && env("HELLOASSO_ORG_SLUG"));

const g = globalThis as unknown as { __haToken?: { value: string; exp: number } };

/** Jeton d'accès (valable 30 min), mis en cache et renouvelé avant expiration. */
async function accessToken(): Promise<string> {
  if (g.__haToken && g.__haToken.exp > Date.now() + 60_000) return g.__haToken.value;
  const res = await fetch(`${base()}/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "client_credentials", client_id: env("HELLOASSO_CLIENT_ID"), client_secret: env("HELLOASSO_CLIENT_SECRET") }),
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw new Error("Authentification HelloAsso refusée.");
  const data = (await res.json()) as { access_token?: string; expires_in?: number };
  if (!data.access_token) throw new Error("Authentification HelloAsso refusée.");
  g.__haToken = { value: data.access_token, exp: Date.now() + (data.expires_in ?? 1800) * 1000 };
  return data.access_token;
}

async function api<T>(pathname: string, init?: { method?: string; body?: unknown }): Promise<T> {
  const res = await fetch(`${base()}/v5${pathname}`, {
    method: init?.method ?? "GET",
    headers: { Authorization: `Bearer ${await accessToken()}`, ...(init?.body ? { "Content-Type": "application/json" } : {}) },
    body: init?.body ? JSON.stringify(init.body) : undefined,
    cache: "no-store",
    signal: AbortSignal.timeout(20_000),
  });
  const text = await res.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    /* réponse non JSON */
  }
  if (!res.ok) {
    if (res.status === 401) g.__haToken = undefined;
    const detail = (data as { message?: string; errors?: Array<{ message?: string }> } | null);
    throw new Error(detail?.errors?.[0]?.message ?? detail?.message ?? `Erreur HelloAsso (${res.status}).`);
  }
  return data as T;
}

export type PaymentKind = "registration" | "order";

export interface Checkout {
  id: string;
  url: string;
}

/**
 * Crée une intention de paiement. Le montant est TOUJOURS celui calculé par le serveur (réductions déjà déduites) ;
 * la référence de l'enregistrement est jointe en métadonnée pour rapprocher la notification.
 */
export async function createCheckout(opts: {
  kind: PaymentKind;
  refId: string;
  itemName: string;
  totalCents: number;
  payer: { firstName: string; lastName: string; email: string };
  returnUrl: string;
  backUrl: string;
  errorUrl: string;
}): Promise<Checkout> {
  if (!Number.isInteger(opts.totalCents) || opts.totalCents < 1) throw new Error("Montant invalide.");
  const data = await api<{ id?: number; redirectUrl?: string }>(`/organizations/${encodeURIComponent(env("HELLOASSO_ORG_SLUG"))}/checkout-intents`, {
    method: "POST",
    body: {
      totalAmount: opts.totalCents,
      initialAmount: opts.totalCents,
      itemName: opts.itemName.slice(0, 250),
      backUrl: opts.backUrl,
      errorUrl: opts.errorUrl,
      returnUrl: opts.returnUrl,
      containsDonation: false,
      payer: { firstName: opts.payer.firstName.slice(0, 80), lastName: opts.payer.lastName.slice(0, 80), email: opts.payer.email },
      metadata: { kind: opts.kind, ref: opts.refId },
    },
  });
  if (!data.id || !data.redirectUrl) throw new Error("Réponse HelloAsso incomplète.");
  return { id: String(data.id), url: data.redirectUrl };
}

export interface CheckoutState {
  id: string;
  metadata?: { kind?: string; ref?: string };
  order?: {
    id?: number;
    amount?: { total?: number };
    payments?: Array<{ id?: number; amount?: number; amountTip?: number; state?: string }>;
  };
}

/** Relit l'intention de paiement chez HelloAsso : c'est la seule source de vérité (jamais l'adresse de retour ni le corps d'une notification). */
export async function retrieveCheckout(id: string): Promise<CheckoutState> {
  if (!/^\d{1,20}$/.test(id)) throw new Error("Identifiant de paiement invalide.");
  const data = await api<CheckoutState>(`/organizations/${encodeURIComponent(env("HELLOASSO_ORG_SLUG"))}/checkout-intents/${id}`);
  return { ...data, id };
}

/** Paiement encaissé et rapproché : commande créée, paiement « Authorized », montants identiques à ceux attendus (pourboire HelloAsso exclu). */
export function paidAmount(c: CheckoutState): number | null {
  const pay = c.order?.payments?.find((p) => p.state === "Authorized");
  if (!c.order || !pay || typeof pay.amount !== "number") return null;
  const net = pay.amount - (pay.amountTip ?? 0);
  if (typeof c.order.amount?.total === "number" && c.order.amount.total !== net) return null;
  return net;
}

/** Rembourse intégralement le paiement (remboursement réel chez HelloAsso). */
export async function refundCheckout(id: string) {
  const c = await retrieveCheckout(id);
  const pay = c.order?.payments?.find((p) => p.state === "Authorized");
  if (!pay?.id) throw new Error("Aucun paiement encaissé à rembourser pour cette transaction.");
  return api<{ id?: number; state?: string }>(`/payments/${pay.id}/refund?comment=${encodeURIComponent("Remboursement demandé par l'association")}&sendRefundMail=true`, { method: "POST" });
}

/** Signature d'une notification : HMAC-SHA256 hexadécimal du corps brut (en-tête x-ha-signature). */
export function verifySignature(rawBody: string, header: string | null, key: string) {
  if (!header || !key) return false;
  const expected = createHmac("sha256", key).update(rawBody).digest();
  const got = Buffer.from(header.trim().toLowerCase(), "hex");
  return got.length === expected.length && timingSafeEqual(got, expected);
}
