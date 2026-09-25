import RegistrationsPage from "../inscriptions/page";
import type { SP } from "@/lib/admin/params";

export const metadata = { title: "Présences" };

export default function AttendancePage({ searchParams }: { searchParams: Promise<SP> }) {
  return RegistrationsPage({ searchParams, vue: "presences" });
}
