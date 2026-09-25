import type { Metadata } from "next";
import { MembershipExperience } from "@/components/membership/MembershipExperience";
import { currentMember } from "@/data/members";
import { membership } from "@/data/membership";
import { formatYear } from "@/lib/format";

export const metadata: Metadata = {
  title: "Abonnement",
  description: "La carte membre des Dames du Parc : réductions, événements, newsletter, carte virtuelle Apple Wallet. 12 € par saison.",
};

export default function AbonnementPage() {
  const { profile, membership: m } = currentMember;
  const number = m.memberNumber.replace(/^DDP-/, "").replace("-", " ");
  return (
    <main>
      <MembershipExperience
        name={`${profile.firstName} ${profile.lastName}`}
        since={formatYear(m.joinedAt)}
        number={number}
        season={membership.season}
        qrValue={`https://www.lesdamesduparc.fr/membre/${m.memberNumber}`}
      />
    </main>
  );
}
