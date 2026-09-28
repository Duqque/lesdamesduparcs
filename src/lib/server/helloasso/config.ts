import "server-only";

/**
 * Configuration HelloAsso centralisée : environnement (sandbox ou production), adresses de l'API et identifiants.
 *
 * Les deux environnements sont totalement séparés chez HelloAsso (comptes, identifiants et organisations différents).
 * Pour ne jamais les mélanger :
 *  - HELLOASSO_ENV = "sandbox" | "production" choisit l'environnement (par défaut : production en production, sandbox ailleurs) ;
 *  - les identifiants peuvent être préfixés : HELLOASSO_SANDBOX_CLIENT_ID / HELLOASSO_PRODUCTION_CLIENT_ID (prioritaires sur
 *    HELLOASSO_CLIENT_ID), idem pour CLIENT_SECRET et ORGANIZATION_SLUG ;
 *  - un jeton obtenu dans un environnement n'est jamais réutilisé dans l'autre (cache par environnement).
 *
 * Adresses officielles (documentation HelloAsso « Introduction à l'API ») :
 *  production : https://api.helloasso.com/oauth2/token  et  https://api.helloasso.com/v5
 *  sandbox    : https://api.helloasso-sandbox.com/oauth2/token  et  https://api.helloasso-sandbox.com/v5
 */
export type HelloAssoEnv = "sandbox" | "production";

const env = (k: string) => process.env[k]?.trim() ?? "";

export function helloAssoEnv(): HelloAssoEnv {
  const v = env("HELLOASSO_ENV").toLowerCase();
  if (v === "sandbox" || v === "production") return v;
  if (env("HELLOASSO_SANDBOX") === "1") return "sandbox";
  return process.env.NODE_ENV === "production" ? "production" : "sandbox";
}

const pick = (name: string, e: HelloAssoEnv) => env(`HELLOASSO_${e.toUpperCase()}_${name}`) || env(`HELLOASSO_${name}`);

export interface HelloAssoConfig {
  env: HelloAssoEnv;
  apiUrl: string;
  authUrl: string;
  clientId: string;
  clientSecret: string;
  organizationSlug: string;
  webhookSecret: string;
  signatureKey: string;
  configured: boolean;
}

export function helloAssoConfig(): HelloAssoConfig {
  const e = helloAssoEnv();
  const host = env("HELLOASSO_API_BASE") || (e === "sandbox" ? "https://api.helloasso-sandbox.com" : "https://api.helloasso.com");
  const clientId = pick("CLIENT_ID", e);
  const clientSecret = pick("CLIENT_SECRET", e);
  const organizationSlug = pick("ORGANIZATION_SLUG", e) || pick("ORG_SLUG", e);
  return {
    env: e,
    apiUrl: env("HELLOASSO_API_URL").replace(/\/$/, "") || `${host}/v5`,
    authUrl: env("HELLOASSO_AUTH_URL") || `${host}/oauth2/token`,
    clientId,
    clientSecret,
    organizationSlug,
    webhookSecret: env("HELLOASSO_WEBHOOK_SECRET"),
    signatureKey: env("HELLOASSO_SIGNATURE_KEY"),
    configured: Boolean(clientId && clientSecret && organizationSlug),
  };
}

export const paymentConfigured = () => helloAssoConfig().configured;

/** Adresses IP qui envoient les notifications HelloAsso (documentation « Sécuriser les webhooks »). */
export const HELLOASSO_WEBHOOK_IPS: Record<HelloAssoEnv, string> = { production: "51.138.206.200", sandbox: "4.233.135.234" };
