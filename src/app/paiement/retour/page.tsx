import type { Metadata } from "next";
import { Suspense } from "react";
import { PaymentStatusClient } from "../PaymentStatusClient";

export const metadata: Metadata = { title: "Confirmation du paiement", robots: { index: false } };

export default function PaymentReturnPage() {
  return (
    <Suspense fallback={null}>
      <PaymentStatusClient mode="retour" />
    </Suspense>
  );
}
