import { NextResponse } from "next/server";
import { audit, getAdmin } from "@/lib/server/admin-auth";
import { getTransactions, membershipsOf } from "@/lib/server/business";
import { getMemberById, listAllRegistrations } from "@/lib/server/store";

/** Export des données personnelles d'une adhérente (droit d'accès et de portabilité), au format JSON. */
export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const admin = await getAdmin();
  if (!admin) return NextResponse.redirect(new URL("/admin/connexion", req.url));
  if (!admin.can("members.export") || !admin.can("members.pii")) return new Response("Accès refusé.", { status: 403 });
  const { id } = await ctx.params;
  const stored = await getMemberById(id);
  if (!stored) return new Response("Introuvable.", { status: 404 });
  const { passwordHash: _p, token: _t, ...m } = stored;
  void _p;
  void _t;
  const [memberships, txs, regs] = await Promise.all([membershipsOf(id), getTransactions(), listAllRegistrations()]);
  const data = { exporteLe: new Date().toISOString(), adherente: m, adhesions: memberships, paiements: txs.filter((t) => t.memberNumber === m.memberNumber), inscriptions: regs.filter((r) => r.memberNumber === m.memberNumber) };
  await audit(admin, "export", "adhérente", `Export des données personnelles : ${m.firstName} ${m.lastName}`, { entityId: id });
  return new Response(JSON.stringify(data, null, 2), { headers: { "Content-Type": "application/json; charset=utf-8", "Content-Disposition": `attachment; filename="donnees-${m.memberNumber}.json"`, "Cache-Control": "no-store" } });
}
