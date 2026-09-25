import { getSession } from "@/lib/server/session";
import { getAdmin } from "@/lib/server/admin-auth";
import { json } from "@/lib/server/http";

/** Session du site public : membre connectée, sinon administratrice (pour afficher le lien d'administration). */
export async function GET() {
  const s = await getSession();
  if (s) return json(s);
  const admin = await getAdmin();
  if (admin) return json({ role: "admin", firstName: admin.admin.firstName, lastName: admin.admin.lastName, email: admin.admin.email });
  return json({ role: "anon" });
}
