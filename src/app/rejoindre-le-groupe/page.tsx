import type { Metadata } from "next";
import { membership } from "@/data/membership";
import { JoinClient } from "./JoinClient";

export const metadata: Metadata = {
  title: "Rejoindre le groupe",
  description: "La carte membre des Dames du Parc : réductions, événements, newsletter, carte virtuelle Apple Wallet. 12 € par saison.",
};

export default function JoinPage() {
  return (
    <main>
      <JoinClient season={membership.season} />
    </main>
  );
}
