import type { ReactNode } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { requireAdmin } from "@/lib/server/admin-auth";
import { ensureNotifyBaseline } from "@/lib/server/notify";

export default async function PanelLayout({ children }: { children: ReactNode }) {
  const ctx = await requireAdmin(undefined, { allowLimited: true });
  void ensureNotifyBaseline().catch(() => undefined);
  return <AdminShell ctx={ctx}>{children}</AdminShell>;
}
