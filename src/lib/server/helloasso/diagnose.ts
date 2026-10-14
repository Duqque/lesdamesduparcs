import "server-only";
import { dropAccessToken } from "./auth";
import { haFetch, HelloAssoError } from "./client";
import { helloAssoConfig } from "./config";

export interface DiagStep {
  label: string;
  ok: boolean;
  detail: string;
}

const mask = (v: string) => (v.length > 8 ? `${v.slice(0, 4)}…${v.slice(-4)}` : "••••");
const why = (e: unknown) => (e instanceof HelloAssoError ? `HTTP ${e.status}${e.code ? ` (${e.code})` : ""} : ${e.message}` : e instanceof Error ? e.message : String(e));

/**
 * Teste la chaîne de paiement HelloAsso étape par étape, en s'arrêtant à la première qui échoue : variables d'environnement,
 * authentification, accès à l'organisation, puis création d'une intention de paiement de test (1 €, jamais encaissée : sans
 * paiement, elle expire d'elle-même). Chaque échec renvoie la réponse exacte de HelloAsso et la piste de correction.
 */
export async function diagnoseHelloAsso(site: string): Promise<DiagStep[]> {
  const c = helloAssoConfig();
  const steps: DiagStep[] = [];
  const envPrefix = `HELLOASSO_${c.env.toUpperCase()}_`;

  const missing = [!c.clientId && "CLIENT_ID", !c.clientSecret && "CLIENT_SECRET", !c.organizationSlug && "ORGANIZATION_SLUG"].filter((x): x is string => Boolean(x));
  steps.push({
    label: "Variables d'environnement",
    ok: missing.length === 0,
    detail: missing.length
      ? `Manquant : ${missing.map((m) => `HELLOASSO_${m}`).join(", ")} (ou ${envPrefix}…) dans le .env du serveur, puis redémarrer l'application.`
      : `Environnement « ${c.env} » (HELLOASSO_ENV), API ${c.apiUrl}, organisation « ${c.organizationSlug} », identifiant client ${mask(c.clientId)}.`,
  });
  if (missing.length) return steps;

  try {
    const res = await fetch(c.authUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ grant_type: "client_credentials", client_id: c.clientId, client_secret: c.clientSecret }),
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });
    const text = (await res.text()).slice(0, 300);
    if (!res.ok || !/access_token/.test(text)) {
      steps.push({
        label: "Connexion à HelloAsso",
        ok: false,
        detail: `Refusée (HTTP ${res.status}${text ? ` : ${text}` : ""}). L'identifiant ou le secret ne correspondent pas à l'environnement « ${c.env} » : les identifiants de la sandbox (helloasso-sandbox.com) ne fonctionnent pas en production, et inversement. Recopiez-les depuis votre espace HelloAsso ${c.env === "production" ? "(helloasso.com)" : "(helloasso-sandbox.com)"} > Mon compte > Intégrations et API.`,
      });
      return steps;
    }
    steps.push({ label: "Connexion à HelloAsso", ok: true, detail: "Identifiant et secret acceptés." });
  } catch (e) {
    steps.push({ label: "Connexion à HelloAsso", ok: false, detail: `HelloAsso injoignable depuis le serveur : ${why(e)}` });
    return steps;
  }
  dropAccessToken();

  try {
    const org = await haFetch<{ name?: string }>(`/organizations/${encodeURIComponent(c.organizationSlug)}`);
    steps.push({ label: "Organisation", ok: true, detail: `Trouvée : « ${org?.name ?? c.organizationSlug} ».` });
  } catch (e) {
    const status = e instanceof HelloAssoError ? e.status : 0;
    steps.push({
      label: "Organisation",
      ok: false,
      detail: `${why(e)}. ${
        status === 404
          ? `Le nom court « ${c.organizationSlug} » n'existe pas : c'est la fin de l'adresse de votre page, helloasso.com/associations/<nom-court>.`
          : "Ces identifiants API n'ont pas accès à cette organisation : ils doivent avoir été créés depuis l'espace de l'association elle-même."
      }`,
    });
    return steps;
  }

  try {
    const r = await haFetch<{ id?: number; redirectUrl?: string }>(`/organizations/${encodeURIComponent(c.organizationSlug)}/checkout-intents`, {
      method: "POST",
      body: {
        totalAmount: 100,
        initialAmount: 100,
        itemName: "Test de connexion (aucun paiement)",
        backUrl: `${site}/admin/configuration/paiements`,
        errorUrl: `${site}/admin/configuration/paiements`,
        returnUrl: `${site}/admin/configuration/paiements`,
        containsDonation: false,
        metadata: { kind: "diagnostic", env: c.env },
      },
    });
    steps.push({ label: "Création d'un paiement", ok: Boolean(r.id && r.redirectUrl), detail: r.id ? `Demande de paiement de test acceptée (n° ${r.id}). Rien n'est encaissé : sans paiement, elle expire d'elle-même.` : "Réponse HelloAsso incomplète." });
  } catch (e) {
    const status = e instanceof HelloAssoError ? e.status : 0;
    const hint = !site.startsWith("https://")
      ? ` L'adresse du site (${site}) doit commencer par https:// : vérifiez NEXT_PUBLIC_SITE_URL.`
      : status === 401 || status === 403
        ? " L'association n'a pas encore le droit d'encaisser par API : dans votre espace HelloAsso, terminez la vérification de l'association et du compte bancaire, et vérifiez que l'accès « Checkout » est activé pour ces identifiants API."
        : "";
    steps.push({ label: "Création d'un paiement", ok: false, detail: `${why(e)}.${hint}` });
  }
  return steps;
}
