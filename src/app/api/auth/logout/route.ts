import { clearSession } from "@/lib/server/session";
import { clearAdminCookie } from "@/lib/server/admin-auth";
import { json } from "@/lib/server/http";

export async function POST() {
  await clearSession();
  await clearAdminCookie();
  return json({ ok: true });
}
