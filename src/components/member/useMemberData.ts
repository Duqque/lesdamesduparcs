"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import type { MemberPublic } from "@/lib/members";

export interface MemberSpace {
  member: Omit<MemberPublic, "authorizations"> & { authorizations: Array<{ id: string; name: string }> };
  verifyUrl: string;
  orders: Array<{ id: string; createdAt: string; status: "awaiting_payment" | "paid"; totalCents: number; items: number; label: string }>;
  registrations: Array<{ id: string; eventId: string; title: string; createdAt: string; status: "confirmed" | "awaiting_payment" | "paid"; amountCents: number; places: number }>;
}

/** Fiche, carte, commandes et inscriptions de la membre connectée (null tant que non chargé ou si non connectée). */
export function useMemberData() {
  const { session } = useAuth();
  const memberNumber = session.status === "member" ? session.memberNumber : null;
  const [state, setState] = useState<{ key: string; data: MemberSpace } | null>(null);

  useEffect(() => {
    if (!memberNumber) return;
    let live = true;
    fetch("/api/members/me", { cache: "no-store" })
      .then((r) => (r.ok ? (r.json() as Promise<MemberSpace>) : null))
      .then((data) => {
        if (live && data) setState({ key: memberNumber, data });
      })
      .catch(() => undefined);
    return () => {
      live = false;
    };
  }, [memberNumber]);

  return memberNumber && state?.key === memberNumber ? state.data : null;
}
