import { json } from "@/lib/server/http";
import { getAdmin } from "@/lib/server/admin-auth";
import { getTransactions } from "@/lib/server/business";
import { articlesDb } from "@/lib/server/content";
import { getAllEventsAdmin } from "@/lib/server/events";
import { loadMemberRows } from "@/lib/server/admin-data";
import { productsDb } from "@/lib/server/shop";
import { listOrders } from "@/lib/server/store";
import { eur, fmtDate } from "@/lib/admin/format";

/** Recherche globale, limitée aux données que l'administratrice a le droit de consulter. */
export async function GET(req: Request) {
  const ctx = await getAdmin();
  if (!ctx) return json({ error: "Non autorisé." }, 401);
  const q = (new URL(req.url).searchParams.get("q") ?? "").trim().toLowerCase();
  if (q.length < 2) return json([]);
  const hits: Array<{ type: string; title: string; sub?: string; href: string }> = [];
  const has = (...v: Array<string | undefined>) => v.some((x) => x?.toLowerCase().includes(q));

  if (ctx.can("members.view")) {
    for (const r of (await loadMemberRows()).filter((r) => has(r.member.firstName, r.member.lastName, `${r.member.firstName} ${r.member.lastName}`, r.member.email, r.member.memberNumber)).slice(0, 6))
      hits.push({ type: "Adhérente", title: `${r.member.firstName} ${r.member.lastName}`, sub: `${r.member.memberNumber} · ${r.member.email}`, href: `/admin/adherentes/${r.member.id}` });
  }
  if (ctx.can("events.view")) {
    for (const e of (await getAllEventsAdmin()).filter((e) => has(e.title, e.subtitle, e.venue, e.id)).slice(0, 5)) hits.push({ type: "Événement", title: e.title, sub: `${fmtDate(e.date)} · ${e.venue}`, href: `/admin/evenements/${e.id}` });
  }
  if (ctx.can("finance.view")) {
    for (const t of (await getTransactions()).filter((t) => has(t.name, t.email, t.label, t.reference)).slice(0, 5)) hits.push({ type: "Paiement", title: `${t.name} · ${eur(t.amountCents)}`, sub: `${t.type} · ${t.label}`, href: `/admin/finances/transactions?q=${encodeURIComponent(t.reference)}` });
  }
  if (ctx.can("shop.view")) {
    for (const p of (await productsDb.all()).filter((p) => has(p.name, p.sku)).slice(0, 4)) hits.push({ type: "Produit", title: p.name, sub: `${p.category} · ${eur(p.priceCents)}`, href: `/admin/boutique/${p.id}` });
  }
  if (ctx.can("shop.orders")) {
    for (const o of (await listOrders()).filter((o) => has(o.id, o.contact.firstName, o.contact.lastName, o.contact.email)).slice(0, 4)) hits.push({ type: "Commande", title: `${o.id.slice(0, 8).toUpperCase()} · ${o.contact.firstName} ${o.contact.lastName}`, sub: eur(o.totalCents), href: `/admin/boutique/commandes/${o.id}` });
  }
  if (ctx.can("content.edit")) {
    for (const a of (await articlesDb.all()).filter((a) => has(a.title, a.category)).slice(0, 4)) hits.push({ type: "Article", title: a.title, sub: a.category, href: `/admin/contenu/${a.id}` });
  }
  return json(hits.slice(0, 20));
}
