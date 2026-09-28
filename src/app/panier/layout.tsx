import type { ReactNode } from "react";
import { PageGate } from "@/components/errors/PageGate";

/** Le panier et la commande suivent l'état de la boutique. */
export default function Layout({ children }: { children: ReactNode }) {
  return <PageGate path="/boutique">{children}</PageGate>;
}
