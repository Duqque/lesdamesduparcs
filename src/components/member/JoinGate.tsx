"use client";

import { cloneElement, isValidElement, type ReactElement, type ReactNode } from "react";
import { useAuth } from "@/components/auth/AuthProvider";

/** Page où la membre renouvelle ou finalise son adhésion (bouton de paiement HelloAsso). */
export const ADHESION_HREF = "/profil#adhesion";

export type JoinMode = "join" | "adhere" | "renew" | "pay" | "hidden";

/**
 * Comportement des appels à l'action d'adhésion selon l'abonnement :
 *  - visiteuse (ou administratrice) : « Adhérer » vers le formulaire d'inscription ;
 *  - membre connectée sans adhésion : adhérer depuis son espace ; adhésion à régler : « Finaliser » ;
 *  - adhésion terminée : « Renouveler mon adhésion » ;
 *  - adhésion active (ou compte suspendu) : le bouton disparaît.
 */
export function useJoinMode(): JoinMode {
  const { session } = useAuth();
  if (session.status !== "member") return "join";
  switch (session.membership) {
    case "active":
    case "suspended":
      return "hidden";
    case "expired":
      return "renew";
    case "pending":
      return "pay";
    default:
      return "adhere";
  }
}

export const JOIN_LABELS: Record<Exclude<JoinMode, "hidden">, string | null> = {
  join: null,
  adhere: null,
  renew: "Renouveler mon adhésion",
  pay: "Finaliser mon adhésion",
};

/** Habille un bouton ou un lien d'adhésion existant : garde son style, adapte le texte et la destination, ou le retire. */
export function JoinGate({ children }: { children: ReactElement<{ href?: string; children?: ReactNode }> }) {
  const mode = useJoinMode();
  if (mode === "hidden") return null;
  if (mode === "join" || !isValidElement(children)) return children;
  const label = JOIN_LABELS[mode];
  return cloneElement(children, { href: ADHESION_HREF, ...(label ? { children: label } : {}) });
}

/** Retire tout un bloc d'adhésion (bandeau, carte…) pour les membres dont l'abonnement est actif. */
export function JoinSectionGate({ children }: { children: ReactNode }) {
  return useJoinMode() === "hidden" ? null : <>{children}</>;
}

/** Texte adapté au visiteur : `guest` par défaut, `renew` quand l'adhésion est terminée, `pay` quand elle reste à régler. */
export function JoinText({ guest, renew, pay }: { guest: ReactNode; renew: ReactNode; pay?: ReactNode }) {
  const mode = useJoinMode();
  return <>{mode === "renew" ? renew : mode === "pay" ? (pay ?? renew) : guest}</>;
}
