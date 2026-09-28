import "server-only";
import { haFetch } from "./client";

/** Lecture d'une commande HelloAsso (GET /orders/{orderId}) : utile au diagnostic d'un paiement non rapproché. */
export const getHelloAssoOrder = (orderId: number | string) => haFetch<Record<string, unknown>>(`/orders/${encodeURIComponent(String(orderId))}`);

/** Lecture d'un paiement HelloAsso (GET /payments/{paymentId}) : état (Authorized, Refused, Refunded…) et remboursements. */
export const getHelloAssoPayment = (paymentId: number | string) => haFetch<{ id?: number; state?: string; amount?: number; amountTip?: number; refundOperations?: unknown[] }>(`/payments/${encodeURIComponent(String(paymentId))}`);
