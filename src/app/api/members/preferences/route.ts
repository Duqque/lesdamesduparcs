import { json } from "@/lib/server/http";
import { getSession } from "@/lib/server/session";
import { getMemberByNumber, updateMember } from "@/lib/server/store";

/** Préférence d'e-mails de la membre connectée : recevoir (ou non) un message à chaque nouvel article, événement ou produit. */
export async function POST(req: Request) {
  const s = await getSession();
  if (s?.role !== "member") return json({ error: "Non connectée." }, 401);
  const body = (await req.json().catch(() => null)) as { emailUpdates?: unknown } | null;
  if (typeof body?.emailUpdates !== "boolean") return json({ error: "Requête invalide." }, 400);
  const m = await getMemberByNumber(s.memberNumber);
  if (!m) return json({ error: "Compte introuvable." }, 404);
  await updateMember(m.id, { emailUpdates: body.emailUpdates });
  return json({ ok: true, emailUpdates: body.emailUpdates });
}
