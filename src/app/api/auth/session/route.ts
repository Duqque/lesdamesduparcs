import { getSession } from "@/lib/server/session";
import { getAdmin } from "@/lib/server/admin-auth";
import { json } from "@/lib/server/http";
import { getMemberByNumber } from "@/lib/server/store";
import { adhesionCapStatus, membershipState } from "@/lib/server/business";

/** Session du site public : membre connectée, sinon administratrice (pour afficher le lien d'administration). */
export async function GET() {
  const s = await getSession();
  // Plafond de la première vague : lu par toutes les visiteuses (même anonymes), pour désactiver le bouton « Devenir membre ».
  const capReached = (await adhesionCapStatus()).blocked;
  if (s?.role === "member") {
    const stored = await getMemberByNumber(s.memberNumber);
    return json({ ...s, membership: stored ? await membershipState(stored.id) : "none", capReached });
  }
  if (s) return json({ ...s, capReached });
  const admin = await getAdmin();
  if (admin) return json({ role: "admin", firstName: admin.admin.firstName, lastName: admin.admin.lastName, email: admin.admin.email, capReached });
  return json({ role: "anon", capReached });
}
