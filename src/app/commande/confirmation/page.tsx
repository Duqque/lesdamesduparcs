import type { Metadata } from "next";
import { Suspense } from "react";
import { ConfirmationClient } from "./ConfirmationClient";

export const metadata: Metadata = { title: "Confirmation de commande", robots: { index: false } };

export default function ConfirmationPage() {
  return (
    <Suspense fallback={null}>
      <ConfirmationClient />
    </Suspense>
  );
}
