import type { ReactNode } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { requireAdmin } from "@/lib/server/admin-auth";

export default async function PanelLayout({ children }: { children: ReactNode }) {
  const ctx = await requireAdmin();
  return <AdminShell ctx={ctx}>{children}</AdminShell>;
}
