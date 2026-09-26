"use client";

import { useAuth } from "@/components/auth/AuthProvider";
import { MembershipExperience } from "@/components/membership/MembershipExperience";
import { useMemberData } from "@/components/member/useMemberData";

/** Carte d'exemple pour une visiteuse ; carte personnalisée (avec son vrai QR code) pour une membre connectée. */
export function JoinClient({ season }: { season: string }) {
  const { session } = useAuth();
  const data = useMemberData();
  const member = session.status === "member" ? session : null;
  return (
    <MembershipExperience
      name={member ? `${member.firstName} ${member.lastName}` : "Prénom Nom"}
      since={member ? "" : String(new Date().getFullYear())}
      number={member ? member.memberNumber : "XXXXXX000000-LDDP0000"}
      season={season}
      qrValue={member && data ? data.verifyUrl : "https://www.lesdamesduparc.com/rejoindre-le-groupe"}
    />
  );
}
