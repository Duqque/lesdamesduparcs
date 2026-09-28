import { defaultPlan, activePrice, membershipState } from "@/lib/server/business";
import { json } from "@/lib/server/http";
import { getSession } from "@/lib/server/session";
import { getMemberByNumber } from "@/lib/server/store";
import { seasonOf } from "@/lib/season";

/** Adhésion proposée dans le panier : uniquement pour une membre connectée dont l'adhésion n'est pas active. Le prix vient de la formule (serveur). */
export async function GET() {
  const session = await getSession();
  if (session?.role !== "member") return json({ available: false });
  const stored = await getMemberByNumber(session.memberNumber);
  const state = stored ? await membershipState(stored.id) : "none";
  const plan = await defaultPlan();
  if (!stored || !plan || !["pending", "expired", "none"].includes(state)) return json({ available: false });
  return json({ available: true, state, planName: `${plan.name} ${seasonOf().label}`, amountCents: activePrice(plan) });
}
