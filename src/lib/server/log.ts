import "server-only";

/**
 * Journal structuré (une ligne JSON par événement, sur la sortie standard du serveur) pour suivre la chaîne de paiement.
 * Les valeurs sensibles (secrets, jetons, mots de passe, clés, numéros de carte) ne sont jamais écrites.
 */
export type LogEvent =
  | "checkout_created" | "checkout_failed" | "checkout_retry"
  | "webhook_received" | "webhook_processed" | "webhook_duplicate" | "webhook_failed" | "webhook_rejected"
  | "payment_created" | "payment_refused" | "payment_refunded"
  | "order_paid" | "order_failed" | "order_refunded"
  | "membership_activated" | "stock_confirmed" | "stock_released"
  | "email_queued" | "email_sent" | "email_failed"
  | "reconcile";

const SENSITIVE = /secret|token|password|passwd|authorization|api[-_]?key|signature|card|iban|cvv|cvc|pan\b|database_url/i;

const clean = (v: unknown, depth = 0): unknown => {
  if (v === null || typeof v !== "object") return typeof v === "string" && v.length > 300 ? `${v.slice(0, 300)}…` : v;
  if (depth > 3) return "[…]";
  if (Array.isArray(v)) return v.slice(0, 20).map((x) => clean(x, depth + 1));
  return Object.fromEntries(Object.entries(v as Record<string, unknown>).map(([k, x]) => [k, SENSITIVE.test(k) ? "[masqué]" : clean(x, depth + 1)]));
};

export function logEvent(event: LogEvent, data: Record<string, unknown> = {}, level: "info" | "warn" | "error" = "info") {
  const line = JSON.stringify({ t: new Date().toISOString(), level, event, ...(clean(data) as Record<string, unknown>) });
  if (level === "error") console.error(line);
  else console.log(line);
}
