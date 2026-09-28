import "server-only";

/**
 * Point d'entrée historique du module HelloAsso (les fichiers vivent dans ./helloasso/ : config, auth, client, checkout, orders,
 * webhooks, types). Ce fichier conserve les noms utilisés dans le reste du site.
 */
export { helloAssoConfig, helloAssoEnv, paymentConfigured, HELLOASSO_WEBHOOK_IPS, type HelloAssoConfig, type HelloAssoEnv } from "./helloasso/config";
export { createCheckoutIntent as createCheckout, retrieveCheckout, paidAmount, isRefused, refundState, refundPayment } from "./helloasso/checkout";
export { verifySignature, eventFingerprint } from "./helloasso/webhooks";
export { getHelloAssoOrder, getHelloAssoPayment } from "./helloasso/orders";
export { HelloAssoError } from "./helloasso/client";
export type { Checkout, CheckoutState, PaymentKind, HelloAssoNotification } from "./helloasso/types";

/** Compatibilité : remboursement intégral d'un paiement (voir refundPayment). */
export { refundPayment as refundCheckout } from "./helloasso/checkout";
