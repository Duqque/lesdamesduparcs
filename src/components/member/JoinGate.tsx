"use client";

import { cloneElement, isValidElement, type ReactElement, type ReactNode } from "react";
import { useAuth } from "@/components/auth/AuthProvider";

/** Page où la membre renouvelle ou finalise son adhésion (bouton de paiement HelloAsso). */
export const ADHESION_HREF = "/rejoindre-le-groupe/paiement";

export type JoinMode = "join" | "adhere" | "renew" | "pay" | "hidden" | "full";

/**
 * Comportement des appels à l'action d'adhésion selon l'abonnement :
 *  - visiteuse (ou administratrice) : « Adhérer » vers le formulaire d'inscription, ou « Adhésions complètes » si le plafond
 *    de la première vague est atteint (Configuration > Adhésions) — jamais pour une adhérente qui renouvelle ;
 *  - membre connectée sans adhésion : adhérer depuis son espace ; adhésion à régler : « Finaliser » ;
 *  - adhésion terminée : « Renouveler mon adhésion » ;
 *  - adhésion active (ou compte suspendu) : le bouton disparaît.
 */
export function useJoinMode(): JoinMode {
  const { session, capReached } = useAuth();
  if (session.status !== "member") return capReached ? "full" : "join";
  switch (session.membership) {
    case "active":
    case "suspended":
    case "expelled":
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
  full: "Adhésions complètes",
};

/** Habille un bouton ou un lien d'adhésion existant : garde son style, adapte le texte et la destination, ou le retire. */
export function JoinGate({ children }: { children: ReactElement<{ href?: string; disabled?: boolean; children?: ReactNode }> }) {
  const mode = useJoinMode();
  if (mode === "hidden") return null;
  if (!isValidElement(children)) return mode === "full" ? null : children;
  if (mode === "full") {
    // Ne jamais retirer le `href` d'un <Link> ou <a> existant (cloneElement) : Next.js plante si un <Link> reçoit
    // href=undefined. On rend un bouton neutre à la place, en reprenant juste la classe visuelle du composant enveloppé.
    const { className } = children.props as { className?: string };
    return <button type="button" disabled className={className}>{JOIN_LABELS.full}</button>;
  }
  if (mode === "join") return children;
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
