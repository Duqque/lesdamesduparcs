import type { ReactNode } from "react";
import { PageGate } from "@/components/errors/PageGate";

export default function Layout({ children }: { children: ReactNode }) {
  return <PageGate path="/rejoindre-le-groupe">{children}</PageGate>;
}
