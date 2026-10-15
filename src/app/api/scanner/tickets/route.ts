import { json } from "@/lib/server/http";
import { scannerAuthorized, scannerSnapshot } from "@/lib/server/scanner-api";

/** Liste des billets pour l'application de contrôle (clé SCANNER_API_KEY). */
export async function GET(req: Request) {
  if (!scannerAuthorized(req)) return json({ error: "Clé d'accès invalide." }, 401);
  return json(await scannerSnapshot());
}
