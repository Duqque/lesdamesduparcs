import type { Metadata } from "next";
import { ConnexionClient } from "./ConnexionClient";

export const metadata: Metadata = { title: "Connexion" };

export default function ConnexionPage() {
  return <ConnexionClient />;
}
