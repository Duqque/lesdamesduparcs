import { NextResponse } from "next/server";
import { siteUrl } from "@/lib/server/http";
import { getSession } from "@/lib/server/session";
import { payments } from "@/lib/server/business";
import { reconcile } from "@/lib/server/payments";
import { paymentConfigured } from "@/lib/server/helloasso";

/** Retour de la page de paiement de l'adhésion : le paiement est relu chez HelloAsso (identifiant enregistré) avant d'activer l'adhésion. */
export async function GET(req: Request) {
  const id = new URL(req.url).searchParams.get("payment") ?? "";
  const go = (state: string) => NextResponse.redirect(`${siteUrl(req)}/profil?adhesion=${state}#adhesion`);
  const s = await getSession();
  const pay = await payments.findOne((p) => p.id === id && p.kind === "adhesion");
  if (s?.role !== "member" || !pay || pay.memberNumber !== s.memberNumber || !pay.checkoutId || !paymentConfigured()) return go("erreur");
  if (new URL(req.url).searchParams.get("code") === "error") return go("attente");
  try {
    const result = await reconcile("membership", pay.id);
    if (result === "paid" || result === "already") return go("paye");
    if (result === "unpaid") return go("attente");
  } catch {
    /* HelloAsso injoignable : la notification ou le rattrapage confirmera */
  }
  return go("erreur");
}
