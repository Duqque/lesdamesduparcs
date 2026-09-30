"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import type { MemberPublic } from "@/lib/members";

export interface MemberSpace {
  member: Omit<MemberPublic, "authorizations"> & { authorizations: Array<{ id: string; name: string }> };
  verifyUrl: string;
  /** Compte Discord associé (OAuth2) : jamais un simple lien d'invitation, voir src/lib/server/discord/. */
  discord: { connected: boolean; username?: string; active: boolean; appUrl?: string };
  membership: { planName: string; season: string; startsAt: string; endsAt: string; status: string } | null;
  transactions: Array<{ id: string; at: string; type: string; label: string; amountCents: number; status: "paid" | "pending" | "failed" | "refunded" | "cancelled"; method: string; invoiceId?: string }>;
  orders: Array<{ id: string; number: string; at: string; status: string; totalCents: number; discountCents: number; promoCode?: string; shippingCents: number; lines: Array<{ name: string; size?: string; qty: number; unitCents: number }>; membership?: { planName: string; amountCents: number }; invoiceId?: string; tracking?: string; fulfilment?: string; resumeToken?: string }>;
  benefits: Array<{ id: string; title: string; text: string }>;
  offers: Array<{ id: string; title: string; text: string; partner?: string; code?: string }>;
}

/** Fiche, carte, commandes et inscriptions de la membre connectée (data à null tant que non chargé ou si non connectée). `refresh` recharge après une modification (ex. photo de profil). */
export function useMemberData() {
  const { session } = useAuth();
  const memberNumber = session.status === "member" ? session.memberNumber : null;
  const [state, setState] = useState<{ key: string; data: MemberSpace } | null>(null);

  const load = useCallback(() => {
    if (!memberNumber) return;
    fetch("/api/members/me", { cache: "no-store" })
      .then((r) => (r.ok ? (r.json() as Promise<MemberSpace>) : null))
      .then((data) => {
        if (data) setState({ key: memberNumber, data });
      })
      .catch(() => undefined);
  }, [memberNumber]);

  useEffect(() => {
    load();
  }, [load]);

  return { data: memberNumber && state?.key === memberNumber ? state.data : null, refresh: load };
}
