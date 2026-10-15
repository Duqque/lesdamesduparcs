import { json, readJson } from "@/lib/server/http";
import { scannerAuthorized, scannerCheckin } from "@/lib/server/scanner-api";

/** Présence relevée par l'application de contrôle (clé SCANNER_API_KEY) : { code, scannedAt?, controller? }. */
export async function POST(req: Request) {
  if (!scannerAuthorized(req)) return json({ error: "Clé d'accès invalide." }, 401);
  const body = await readJson<{ code?: unknown; scannedAt?: unknown; controller?: unknown }>(req);
  if (!body) return json({ error: "Requête invalide." }, 400);
  return json(await scannerCheckin(body));
}
