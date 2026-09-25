import type { Metadata } from "next";
import { ProfilClient } from "./ProfilClient";

export const metadata: Metadata = { title: "Mon espace", robots: { index: false } };

export default async function ProfilPage({ searchParams }: { searchParams: Promise<{ bienvenue?: string }> }) {
  const { bienvenue } = await searchParams;
  return <ProfilClient welcome={bienvenue === "1"} />;
}
