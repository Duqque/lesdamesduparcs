import type { Metadata } from "next";
import { Suspense } from "react";
import { PaymentStatusClient } from "../PaymentStatusClient";

export const metadata: Metadata = { title: "Paiement annulé", robots: { index: false } };

export default function PaymentCancelPage() {
  return (
    <Suspense fallback={null}>
      <PaymentStatusClient mode="annule" />
    </Suspense>
  );
}
