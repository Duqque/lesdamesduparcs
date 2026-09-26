import { json, throttled, tooMany } from "@/lib/server/http";
import { getSession } from "@/lib/server/session";
import { getMemberByNumber, toPublic } from "@/lib/server/store";
import { type Membership, membershipState, currentMembership, paymentOfMembership, payments, renewMembership } from "@/lib/server/business";
import { paymentConfigured } from "@/lib/server/helloasso";
import { startMembershipPayment } from "@/lib/server/checkout";

/**
 * Renouvellement (ou finalisation) de l'adhésion de la membre connectée : crée l'adhésion de la saison en cours si besoin,
 * puis ouvre la page de paiement HelloAsso. Le montant est celui de la formule côté serveur.
 */
export async function POST(req: Request) {
  const s = await getSession();
  if (s?.role !== "member") return json({ error: "Connectez-vous pour renouveler votre adhésion." }, 401);
  if (await throttled(req, "adhesion", 12, 3_600_000)) return tooMany();
  const stored = await getMemberByNumber(s.memberNumber);
  if (!stored) return json({ error: "Compte introuvable." }, 404);
  const member = toPublic(stored);

  const state = await membershipState(member.id);
  if (state === "active") return json({ error: "Votre adhésion est déjà active." }, 409);
  if (state === "suspended") return json({ error: "Votre compte est suspendu : contactez l'association." }, 403);

  let ms: Membership | null = await currentMembership(member.id);
  if (state === "expired" || state === "none" || !ms) ms = await renewMembership(member);
  if (!ms) return json({ error: "Aucune formule d'adhésion n'est disponible pour le moment." }, 503);
  const pay = await paymentOfMembership(ms.id);
  if (!pay || pay.status === "paid") return json({ ok: true, state: "active" });
  if (!paymentConfigured()) return json({ ok: true, state: "pending", offline: true, message: "Le paiement en ligne n'est pas encore disponible : réglez votre adhésion auprès de l'association, elle l'enregistrera." });
  try {
    const checkout = await startMembershipPayment(req, pay, member);
    await payments.update(pay.id, { checkoutId: checkout.id, status: "pending", method: "online" });
    return json({ ok: true, state: "pending", url: checkout.url });
  } catch {
    return json({ error: "Le paiement en ligne est momentanément indisponible. Réessayez dans quelques instants." }, 502);
  }
}
