import { ADHESION_CAP_MESSAGE, adhesionCapStatus, hasPaidMembership, membershipState, currentMembership, paymentOfMembership, payments, renewMembership, type Membership } from "@/lib/server/business";
import { sendTemplate } from "@/lib/server/email";
import { json, siteOrigin, throttled, tooMany } from "@/lib/server/http";
import { getSession } from "@/lib/server/session";
import { eur } from "@/lib/admin/format";
import { getMemberByNumber, toPublic } from "@/lib/server/store";

/**
 * « Je paierai plus tard » (espèces, chèque…) : l'étape de paiement est passée. Le compte est créé ; la carte de membre reste
 * « en cours de création » (QR code « Adhésion invalide ») jusqu'à la validation MANUELLE du règlement par l'équipe. La personne reçoit
 * un e-mail avec le lien pour payer en ligne quand elle le souhaite, puis des rappels 7 et 15 jours après la création du compte.
 */
export async function POST(req: Request) {
  const s = await getSession();
  if (s?.role !== "member") return json({ error: "Connectez-vous pour continuer." }, 401);
  if (await throttled(req, "adhesion-differer", 10, 3_600_000)) return tooMany();
  const stored = await getMemberByNumber(s.memberNumber);
  if (!stored) return json({ error: "Compte introuvable." }, 404);
  const member = toPublic(stored);
  const state = await membershipState(member.id);
  if (state === "active") return json({ ok: true, state: "active" });
  if (state === "suspended" || state === "expelled") return json({ error: "Votre compte ne peut pas adhérer pour le moment : contactez l'association." }, 403);
  if (!(await hasPaidMembership(member.id)) && (await adhesionCapStatus()).blocked) return json({ error: ADHESION_CAP_MESSAGE }, 403);
  let ms: Membership | null = await currentMembership(member.id);
  if (state === "expired" || state === "none" || !ms) ms = await renewMembership(member);
  const pay = ms ? await paymentOfMembership(ms.id) : null;
  if (!pay) return json({ error: "Aucune formule d'adhésion n'est disponible pour le moment." }, 503);
  const first = !pay.deferredAt;
  await payments.update(pay.id, { deferredAt: pay.deferredAt ?? new Date().toISOString() });
  // Un seul e-mail avec le lien de paiement, même si la personne clique plusieurs fois.
  if (first) await sendTemplate("payment_link", member.email, { prenom: member.firstName, montant: eur(pay.amountCents), lien: `${await siteOrigin()}/rejoindre-le-groupe/paiement` });
  return json({ ok: true, state: "pending" });
}
