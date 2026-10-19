import { json, readJson } from "@/lib/server/http";
import { scannerAuthorized, scannerCheckout } from "@/lib/server/scanner-api";

/** Présence annulée par l'application de contrôle (clé SCANNER_API_KEY) : { code, controller? }. */
export async function POST(req: Request) {
  if (!scannerAuthorized(req)) return json({ error: "Clé d'accès invalide." }, 401);
  const body = await readJson<{ code?: unknown; controller?: unknown }>(req);
  if (!body) return json({ error: "Requête invalide." }, 400);
  return json(await scannerCheckout(body));
}
