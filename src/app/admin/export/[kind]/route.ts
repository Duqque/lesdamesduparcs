import { NextResponse } from "next/server";
import { redirectTo } from "@/lib/server/http";
import { eur, fmtDate, fmtDateTime } from "@/lib/admin/format";
import { pick } from "@/lib/admin/params";
import { audit, getAdmin, isFresh } from "@/lib/server/admin-auth";
import { filterMembers, loadMemberRows, type MemberFilters } from "@/lib/server/admin-data";
import { TX_STATUS_LABEL, getTransactions, type Tx } from "@/lib/server/business";
import { getAllEventsAdmin } from "@/lib/server/events";
import { csvResponse, pdfResponse, toCsv, toPdf, type Col } from "@/lib/server/export";
import { listAllRegistrations, listOrders } from "@/lib/server/store";
import { productsDb, totalStock } from "@/lib/server/shop";
import type { Registration } from "@/lib/registration";

const MEMBER_KEYS = ["q", "vue", "plan", "statut", "paiement", "ville", "age", "du", "au", "expDu", "expAu", "mineure", "tri"] as const;
const STATUS = { active: "Active", expired: "Expirée", suspended: "Suspendue", anonymized: "Anonymisée" } as const;
const REG_STATUS = { confirmed: "Confirmée", paid: "Payée", awaiting_payment: "Paiement en attente", waitlist: "Liste d'attente", cancelled: "Annulée", refunded: "Remboursée" } as const;

async function respond<T>(format: string, name: string, title: string, subtitle: string, rows: T[], cols: Col<T>[]) {
  if (format === "pdf") return pdfResponse(name, await toPdf(title, subtitle, rows, cols));
  return csvResponse(name, toCsv(rows, cols));
}

/** Exports CSV / PDF : ils appliquent les filtres reçus dans l'adresse, et sont réservés aux rôles autorisés. */
export async function GET(req: Request, ctx: { params: Promise<{ kind: string }> }) {
  const admin = await getAdmin();
  if (!admin) return redirectTo("/admin/connexion");
  if (admin && !isFresh(admin)) return redirectTo(`/admin/verification-identite?next=${encodeURIComponent(new URL(req.url).pathname + new URL(req.url).search)}`);
  const { kind } = await ctx.params;
  const url = new URL(req.url);
  const format = url.searchParams.get("format") === "pdf" ? "pdf" : "csv";
  const stamp = new Date().toISOString().slice(0, 10);
  const deny = () => new Response("Accès refusé.", { status: 403 });

  if (kind === "adherentes") {
    if (!admin.can("members.export")) return deny();
    const f = pick(Object.fromEntries(url.searchParams), MEMBER_KEYS) as MemberFilters;
    const rows = filterMembers(await loadMemberRows(), f).filter((r) => r.status !== "anonymized");
    const pii = admin.can("members.pii");
    const fin = admin.can("finance.view");
    const cols: Col<(typeof rows)[number]>[] = [
      { label: "N° membre", value: (r) => r.member.memberNumber, w: 1.6 },
      { label: "Nom", value: (r) => r.member.lastName },
      { label: "Prénom", value: (r) => r.member.firstName },
      { label: "E-mail", value: (r) => r.member.email, w: 2 },
      { label: "Téléphone", value: (r) => r.member.phone },
      ...(pii ? [{ label: "Naissance", value: (r: (typeof rows)[number]) => fmtDate(r.member.birthDate) }, { label: "Ville", value: (r: (typeof rows)[number]) => r.member.address.city }, { label: "Code postal", value: (r: (typeof rows)[number]) => r.member.address.postalCode }] : []),
      { label: "Formule", value: (r) => r.planName },
      { label: "Statut", value: (r) => STATUS[r.status] },
      ...(fin ? [{ label: "Paiement", value: (r: (typeof rows)[number]) => (r.payment ? TX_STATUS_LABEL[r.payment] : "") }] : []),
      { label: "Adhésion", value: (r) => fmtDate(r.joinedAt) },
      { label: "Expiration", value: (r) => fmtDate(r.expiresAt) },
    ];
    await audit(admin, "export", "adhérentes", `Export ${format.toUpperCase()} de ${rows.length} adhérente(s)`);
    return respond(format, `adherentes-${stamp}`, "Adhérentes", `${rows.length} adhérente(s) · export du ${fmtDate(new Date().toISOString())}`, rows, cols);
  }

  if (kind === "transactions") {
    if (!admin.can("finance.export")) return deny();
    const statut = url.searchParams.get("statut");
    const type = url.searchParams.get("type");
    const q = url.searchParams.get("q")?.toLowerCase();
    const du = url.searchParams.get("du");
    const au = url.searchParams.get("au");
    const rows = (await getTransactions()).filter((t) => (!statut || t.status === statut) && (!type || t.type === type) && (!du || t.at.slice(0, 10) >= du) && (!au || t.at.slice(0, 10) <= au) && (!q || [t.name, t.email, t.label, t.reference].some((v) => v?.toLowerCase().includes(q))));
    const cols: Col<Tx>[] = [
      { label: "Date", value: (t) => fmtDateTime(t.at) },
      { label: "Nom", value: (t) => t.name, w: 1.5 },
      { label: "Type", value: (t) => t.type },
      { label: "Objet", value: (t) => t.label, w: 2.5 },
      { label: "Montant", value: (t) => eur(t.amountCents) },
      { label: "Méthode", value: (t) => t.method },
      { label: "Statut", value: (t) => TX_STATUS_LABEL[t.status] },
      { label: "Référence", value: (t) => t.reference },
    ];
    await audit(admin, "export", "transactions", `Export ${format.toUpperCase()} de ${rows.length} transaction(s)`);
    return respond(format, `transactions-${stamp}`, "Transactions", `${rows.length} transaction(s) · export du ${fmtDate(new Date().toISOString())}`, rows, cols);
  }

  if (kind === "inscriptions" || kind === "presences") {
    if (!admin.can("events.attendance")) return deny();
    const eventId = url.searchParams.get("evenement");
    const events = await getAllEventsAdmin();
    let rows = await listAllRegistrations();
    if (eventId) rows = rows.filter((r) => r.eventId === eventId);
    const title = (id: string) => events.find((e) => e.id === id)?.title ?? id;
    const fin = admin.can("finance.view");
    const cols: Col<Registration>[] = [
      { label: "Événement", value: (r) => title(r.eventId), w: 2 },
      { label: "Nom", value: (r) => `${r.lastName} ${r.firstName}`, w: 1.5 },
      { label: "E-mail", value: (r) => r.email, w: 2 },
      { label: "Téléphone", value: (r) => r.phone },
      { label: "Places", value: (r) => r.places },
      { label: "Statut", value: (r) => REG_STATUS[r.status] },
      ...(fin ? [{ label: "Montant", value: (r: Registration) => eur(r.amountCents) }] : []),
      { label: "Inscription", value: (r) => fmtDate(r.createdAt) },
      { label: "Présence", value: (r) => (r.attended === true ? "Présente" : r.attended === false ? "Absente" : "") },
    ];
    await audit(admin, "export", kind, `Export ${format.toUpperCase()} de ${rows.length} inscription(s)`);
    return respond(format, `${kind}-${stamp}`, kind === "presences" ? "Présences" : "Inscriptions", `${rows.length} ligne(s) · export du ${fmtDate(new Date().toISOString())}`, rows, cols);
  }

  if (kind === "commandes") {
    if (!admin.can("shop.orders")) return deny();
    const paiement = url.searchParams.get("paiement");
    const suivi = url.searchParams.get("suivi");
    const du = url.searchParams.get("du");
    const au = url.searchParams.get("au");
    const q = url.searchParams.get("q")?.toLowerCase();
    const rows = (await listOrders()).filter((o) => (!paiement || o.status === paiement) && (!suivi || (suivi === "aucun" ? !o.fulfilment : o.fulfilment === suivi)) && (!du || o.createdAt.slice(0, 10) >= du) && (!au || o.createdAt.slice(0, 10) <= au) && (!q || `${o.id} ${o.contact.firstName} ${o.contact.lastName} ${o.contact.email}`.toLowerCase().includes(q)));
    const fin = admin.can("finance.view");
    const cols: Col<(typeof rows)[number]>[] = [
      { label: "N°", value: (o) => o.id.slice(0, 8).toUpperCase() },
      { label: "Date", value: (o) => fmtDateTime(o.createdAt) },
      { label: "Client", value: (o) => `${o.contact.lastName} ${o.contact.firstName}`, w: 1.5 },
      { label: "E-mail", value: (o) => o.contact.email, w: 2 },
      { label: "Articles", value: (o) => o.lines.map((l) => `${l.qty}x ${l.name}${l.size ? ` (${l.size})` : ""}`).join(", "), w: 3 },
      ...(fin ? [{ label: "Total", value: (o: (typeof rows)[number]) => eur(o.totalCents) }] : []),
      { label: "Paiement", value: (o) => ({ paid: "Payée", awaiting_payment: "En attente", refunded: "Remboursée", cancelled: "Annulée" })[o.status] },
      { label: "Suivi", value: (o) => o.fulfilment ?? "" },
      { label: "Livraison", value: (o) => (o.delivery.mode === "home" ? `${o.delivery.address?.line1 ?? ""} ${o.delivery.address?.postalCode ?? ""} ${o.delivery.address?.city ?? ""}` : "Retrait événement"), w: 2 },
    ];
    await audit(admin, "export", "commandes", `Export ${format.toUpperCase()} de ${rows.length} commande(s)`);
    return respond(format, `commandes-${stamp}`, "Commandes", `${rows.length} commande(s) · export du ${fmtDate(new Date().toISOString())}`, rows, cols);
  }

  if (kind === "produits") {
    if (!admin.can("shop.view")) return deny();
    const rows = await productsDb.all();
    const cols: Col<(typeof rows)[number]>[] = [
      { label: "Référence", value: (p) => p.sku },
      { label: "Produit", value: (p) => p.name, w: 3 },
      { label: "Catégorie", value: (p) => p.category },
      { label: "Prix", value: (p) => eur(p.priceCents) },
      { label: "Stock", value: (p) => (p.trackStock ? totalStock(p) : "non suivi") },
      { label: "Statut", value: (p) => ({ draft: "Brouillon", active: "En vente", archived: "Archivé" })[p.status] },
    ];
    return respond(format, `produits-${stamp}`, "Produits", `${rows.length} produit(s)`, rows, cols);
  }

  return new Response("Export inconnu.", { status: 404 });
}
