import { json } from "@/lib/server/http";
import { getSession } from "@/lib/server/session";
import { getMemberByNumber } from "@/lib/server/store";
import { buildMemberExport } from "@/lib/server/privacy";

/** Droit d'accès et de portabilité : la membre connectée télécharge toutes ses données (JSON). */
export async function GET() {
  const s = await getSession();
  if (s?.role !== "member") return json({ error: "Non connectée." }, 401);
  const m = await getMemberByNumber(s.memberNumber);
  const data = m ? await buildMemberExport(m.id) : null;
  if (!data) return json({ error: "Compte introuvable." }, 404);
  return new Response(JSON.stringify(data, null, 2), {
    headers: { "Content-Type": "application/json; charset=utf-8", "Content-Disposition": `attachment; filename="mes-donnees-dames-du-parc.json"`, "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" },
  });
}
