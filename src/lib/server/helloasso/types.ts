export type PaymentKind = "registration" | "order" | "membership";

export interface Checkout {
  id: string;
  url: string;
}

export interface CheckoutPaymentState {
  id?: number;
  amount?: number;
  amountTip?: number;
  /** Pending, Authorized, Refused, Refunded, Refunding, Contested, Registered, Unknown, WaitingBankValidation */
  state?: string;
  refundOperations?: Array<{ amount?: number; status?: string }>;
}

export interface CheckoutState {
  id: string;
  metadata?: { kind?: string; ref?: string; [k: string]: unknown };
  order?: {
    id?: number;
    amount?: { total?: number };
    payments?: CheckoutPaymentState[];
  };
}

/** Notification HelloAsso (Order ou Payment). Le corps n'est qu'un déclencheur : l'état réel est relu par l'API. */
export interface HelloAssoNotification {
  eventType?: string;
  data?: { id?: number; amount?: number; state?: string; order?: { id?: number }; [k: string]: unknown };
  metadata?: { kind?: string; ref?: string; [k: string]: unknown };
}
