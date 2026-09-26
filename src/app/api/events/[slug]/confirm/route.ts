import { NextResponse } from "next/server";
import { getSession } from "@/lib/server/session";
import { siteUrl } from "@/lib/server/http";
import { getRegistration } from "@/lib/server/store";
import { reconcile } from "@/lib/server/payments";
import { paymentConfigured } from "@/lib/server/helloasso";

/**
 * Retour de la page de paiement : l'adresse (code, identifiants) n'est jamais crue. Le paiement est relu chez HelloAsso
 * à partir de l'identifiant enregistré pour CETTE inscription, puis montant et référence sont revérifiés.
 */
export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const url = new URL(req.url);
  const registrationId = url.searchParams.get("registration") ?? "";
  const back = (state: string) => NextResponse.redirect(`${siteUrl(req)}/evenements/${encodeURIComponent(slug)}?paiement=${state}#inscription`);

  const session = await getSession();
  const registration = await getRegistration(registrationId);
  if (!session || session.role !== "member" || !registration || registration.eventId !== slug || registration.memberNumber !== session.memberNumber) return back("erreur");
  if (!paymentConfigured() || !registration.checkoutId) return back("erreur");
  if (url.searchParams.get("code") === "error") return back("annule");

  try {
    const result = await reconcile("registration", registration.id);
    if (result === "paid" || result === "already") return back("succes");
    if (result === "unpaid") return back("annule");
  } catch {
    /* HelloAsso injoignable : l'inscription reste en attente, la notification ou le rattrapage la confirmera */
  }
  return back("erreur");
}
