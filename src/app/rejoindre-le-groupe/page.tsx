import type { Metadata } from "next";
import { seoFor } from "@/lib/server/site";
import { membership } from "@/data/membership";
import { JoinClient } from "./JoinClient";

export async function generateMetadata(): Promise<Metadata> {
  return seoFor("/rejoindre-le-groupe", { title: "Rejoindre le groupe", description: "La carte membre des Dames du Parc : réductions, événements, newsletter, carte virtuelle Apple Wallet. 12 € par saison." });
}

export default function JoinPage() {
  return (
    <main>
      <JoinClient season={membership.season} />
    </main>
  );
}
