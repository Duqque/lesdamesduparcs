/** awaiting_payment = PAYMENT_PENDING, failed = FAILED (paiement refusé ou en erreur, nouvel essai possible), partially_refunded = PARTIALLY_REFUNDED. */
export type OrderStatus = "awaiting_payment" | "paid" | "cancelled" | "refunded" | "failed" | "partially_refunded";
export type Fulfilment = "to_prepare" | "preparing" | "shipped" | "ready_for_pickup" | "delivered";

export interface OrderLine {
  productId: string;
  name: string;
  size?: string;
  qty: number;
  unitCents: number;
}

export interface Address {
  line1: string;
  line2?: string;
  postalCode: string;
  city: string;
  country: string;
}

/** Adhésion incluse dans la commande (commande mixte : adhésion + produits, réglée en un seul paiement). */
export interface OrderMembership {
  planId: string;
  planName: string;
  amountCents: number;
  membershipId: string;
  /** Enregistrement de paiement « adhésion » relié : passe à « payé » avec la commande (sans second paiement) */
  paymentId: string;
}

export interface Order {
  id: string;
  /** Numéro lisible : DDP-2026-00458 */
  orderNumber?: string;
  token: string;
  createdAt: string;
  paidAt?: string;
  status: OrderStatus;
  membership?: OrderMembership;
  /** Nombre de tentatives de paiement (nouvel essai possible tant que la commande n'est pas réglée) */
  attempts?: number;
  refundedCents?: number;
  lines: OrderLine[];
  subtotalCents: number;
  shippingCents: number;
  totalCents: number;
  contact: { email: string; firstName: string; lastName: string; phone?: string };
  delivery: { mode: "home" | "event"; address?: Address };
  memberNumber?: string;
  /** Identifiant du paiement en ligne (HelloAsso) */
  checkoutId?: string;
  /** Suivi de préparation et d'expédition (back-office) */
  fulfilment?: Fulfilment;
  tracking?: string;
  carrier?: string;
  note?: string;
  promoCode?: string;
  discountCents?: number;
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const POSTAL = /^[0-9A-Za-z -]{3,10}$/;

export interface CheckoutInput {
  items: Array<{ productId: string; size?: string; qty: number }>;
  contact: { email: string; firstName: string; lastName: string; phone?: string };
  delivery: { mode: "home" | "event"; address?: Address };
  acceptTerms: boolean;
  promoCode?: string;
}

/** Validation des champs du formulaire de commande (partagée client / serveur). */
export function validateCheckout(input: Partial<CheckoutInput>): Record<string, string> {
  const e: Record<string, string> = {};
  const c = input.contact;
  if (!c?.firstName?.trim()) e.firstName = "Prénom requis.";
  if (!c?.lastName?.trim()) e.lastName = "Nom requis.";
  if (!c?.email || !EMAIL.test(c.email)) e.email = "Adresse e-mail invalide.";
  if (c?.phone && !/^[+0-9][0-9 .()-]{7,19}$/.test(c.phone)) e.phone = "Numéro de téléphone invalide.";
  if (input.delivery?.mode === "home") {
    const a = input.delivery.address;
    if (!a?.line1?.trim()) e.line1 = "Adresse requise.";
    if (!a?.postalCode || !POSTAL.test(a.postalCode)) e.postalCode = "Code postal invalide.";
    if (!a?.city?.trim()) e.city = "Ville requise.";
    if (!a?.country?.trim()) e.country = "Pays requis.";
  } else if (input.delivery?.mode !== "event") {
    e.mode = "Choisissez un mode de livraison.";
  }
  if (!input.acceptTerms) e.acceptTerms = "Vous devez accepter les conditions de vente.";
  return e;
}
