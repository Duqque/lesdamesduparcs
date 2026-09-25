import { json } from "@/lib/server/http";
import { runScheduled } from "@/lib/server/comms";
import { safeEqual } from "@/lib/server/session";

/** Traitement planifié (campagnes programmées, rappels) : à appeler par un cron avec `Authorization: Bearer $CRON_SECRET`. */
export async function POST(req: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization") ?? "";
  if (!secret || !safeEqual(auth, `Bearer ${secret}`)) return json({ error: "Non autorisé." }, 401);
  return json(await runScheduled());
}
