export type OrderStatus = "awaiting_payment" | "paid" | "cancelled" | "refunded";

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

export interface Order {
  id: string;
  token: string;
  createdAt: string;
  status: OrderStatus;
  lines: OrderLine[];
  subtotalCents: number;
  shippingCents: number;
  totalCents: number;
  contact: { email: string; firstName: string; lastName: string; phone?: string };
  delivery: { mode: "home" | "event"; address?: Address };
  memberNumber?: string;
  stripeSessionId?: string;
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const POSTAL = /^[0-9A-Za-z -]{3,10}$/;

export interface CheckoutInput {
  items: Array<{ productId: string; size?: string; qty: number }>;
  contact: { email: string; firstName: string; lastName: string; phone?: string };
  delivery: { mode: "home" | "event"; address?: Address };
  acceptTerms: boolean;
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
