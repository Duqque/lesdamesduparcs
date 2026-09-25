import { json } from "@/lib/server/http";
import { getAdmin } from "@/lib/server/admin-auth";
import { adminNotifications } from "@/lib/server/admin-data";

export async function GET() {
  const ctx = await getAdmin();
  if (!ctx) return json({ error: "Non autorisé." }, 401);
  return json(await adminNotifications(ctx));
}
