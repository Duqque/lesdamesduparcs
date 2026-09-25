"use client";

import { useAuth } from "@/components/auth/AuthProvider";
import { MembershipExperience } from "@/components/membership/MembershipExperience";

/** Carte d'exemple pour un visiteur non connecté ; carte personnalisée pour une membre connectée. */
export function JoinClient({ season }: { season: string }) {
  const { session } = useAuth();
  const member = session.status === "member" ? session : null;
  return (
    <MembershipExperience
      name={member ? `${member.firstName} ${member.lastName}` : "Prénom Nom"}
      since={member ? "" : String(new Date().getFullYear())}
      number={member ? member.memberNumber.replace(/^DDP-/, "").replace("-", " ") : "0000 0000"}
      season={season}
      qrValue={member ? `https://www.lesdamesduparc.fr/membre/${member.memberNumber}` : "https://www.lesdamesduparc.fr/rejoindre-le-groupe"}
    />
  );
}
