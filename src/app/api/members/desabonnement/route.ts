import { json, throttled, tooMany } from "@/lib/server/http";
import { setEmailUpdates } from "@/lib/server/unsubscribe";

/** Désabonnement en un clic (en-tête List-Unsubscribe-Post des e-mails de nouveautés) : POST /api/members/desabonnement?t=<jeton signé>. */
export async function POST(req: Request) {
  if (await throttled(req, "unsubscribe", 30, 600_000)) return tooMany();
  const token = new URL(req.url).searchParams.get("t") ?? "";
  const done = await setEmailUpdates(token, false);
  return done ? json({ ok: true }) : json({ error: "Lien invalide." }, 400);
}
