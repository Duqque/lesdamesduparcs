"use server";

import { createHash } from "node:crypto";
import { redirect } from "next/navigation";
import { privacyRequests } from "@/lib/server/privacy";

export async function confirmPrivacyAction(token: string) {
  const hash = createHash("sha256").update(token).digest("hex");
  const req = await privacyRequests.findOne((r) => r.tokenHash === hash);
  if (req && !req.verified) await privacyRequests.update(req.id, { verified: true });
  redirect(`/mes-donnees/confirmer/${encodeURIComponent(token)}?ok=1`);
}
