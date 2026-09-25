import RegistrationsPage from "../inscriptions/page";
import type { SP } from "@/lib/admin/params";

export const metadata = { title: "Listes d'attente" };

export default function WaitlistPage({ searchParams }: { searchParams: Promise<SP> }) {
  return RegistrationsPage({ searchParams, vue: "attente" });
}
