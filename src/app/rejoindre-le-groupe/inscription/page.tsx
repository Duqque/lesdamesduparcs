import type { Metadata } from "next";
import { InscriptionClient } from "./InscriptionClient";

export const metadata: Metadata = {
  title: "Devenir membre",
  description: "Créez votre compte et recevez votre carte membre des Dames du Parc, avec son QR code de vérification et son attestation PDF.",
};

export default function InscriptionPage() {
  return <InscriptionClient />;
}
