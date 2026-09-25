import "server-only";
import type { ClubEvent } from "@/types";
import { currentMembership } from "./business";
import { getMemberByNumber } from "./store";

/** Prix par place pour une adhérente : un tarif dont le libellé correspond à sa formule d'adhésion l'emporte sur le prix de base. */
export async function eventUnitPrice(event: ClubEvent, memberNumber?: string): Promise<{ unitCents: number; tier?: string }> {
  const cfg = event.registration;
  if (cfg.paymentMode === "none") return { unitCents: 0 };
  if (!memberNumber || !cfg.tiers?.length) return { unitCents: cfg.priceCents };
  const member = await getMemberByNumber(memberNumber);
  const ms = member ? await currentMembership(member.id) : null;
  const tier = ms ? cfg.tiers.find((t) => t.label.trim().toLowerCase() === ms.planName.trim().toLowerCase()) : undefined;
  return tier ? { unitCents: tier.priceCents, tier: tier.label } : { unitCents: cfg.priceCents };
}
