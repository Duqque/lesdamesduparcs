import { NextResponse } from "next/server";
import { getSession } from "@/lib/server/session";
import { siteUrl } from "@/lib/server/http";
import { getRegistration, updateRegistration } from "@/lib/server/store";
import { retrieveCheckoutSession, stripeConfigured } from "@/lib/server/stripe";

/** Retour de Stripe Checkout : vérifie le paiement auprès de Stripe avant de confirmer l'inscription. */
export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const url = new URL(req.url);
  const registrationId = url.searchParams.get("registration") ?? "";
  const sessionId = url.searchParams.get("session_id") ?? "";
  const back = (state: string) => NextResponse.redirect(`${siteUrl(req)}/evenements/${slug}?paiement=${state}#inscription`);

  const session = await getSession();
  const registration = await getRegistration(registrationId);
  if (!session || session.role !== "member" || !registration || registration.eventId !== slug || registration.memberNumber !== session.memberNumber) return back("erreur");
  if (!stripeConfigured() || !sessionId || registration.stripeSessionId !== sessionId) return back("erreur");

  try {
    const checkout = await retrieveCheckoutSession(sessionId);
    if (checkout.payment_status === "paid" && checkout.metadata?.registration === registration.id) {
      await updateRegistration(registration.id, { status: "paid" });
      return back("succes");
    }
  } catch {
    return back("erreur");
  }
  return back("annule");
}
