import type { Metadata } from "next";
import { Suspense } from "react";
import { PaymentStepClient } from "./PaymentStepClient";

export const metadata: Metadata = { title: "Paiement de l'adhésion", robots: { index: false } };

export default function AdhesionPaymentPage() {
  return (
    <Suspense fallback={null}>
      <PaymentStepClient />
    </Suspense>
  );
}
