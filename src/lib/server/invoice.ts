import "server-only";
import { randomUUID } from "node:crypto";
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFImage, type PDFPage } from "pdf-lib";
import { eur } from "@/lib/admin/format";
import { effectivePermissions } from "@/lib/admin/permissions";
import { admins, settings, type AssociationInfo } from "./admin-store";
import { getTransactions, type Tx } from "./business";
import { getBlob, mediaKey, putBlob } from "./blobs";
import { collection, type Row } from "./db";
import { enqueueEmail, processEmailJobsSoon } from "./email-jobs";
import { LOGO_COLOR_PNG } from "./pdf-assets";
import { getMemberByNumber } from "./store";

/**
 * Factures : une facture (reçu acquitté) PDF est éditée automatiquement à chaque paiement validé, quelle que soit son origine
 * (paiement en ligne HelloAsso, validation manuelle par l'équipe). Elle est conservée en base de données, rattachée à la fiche de la
 * personne, téléchargeable dans son espace membre, et envoyée par e-mail à la personne et aux administratrices concernées.
 * Aucun numéro de carte, de chèque ou de compte n'y figure jamais : seulement le MODE de paiement.
 */
export interface Invoice extends Row {
  number: string;
  year: number;
  seq: number;
  txId: string;
  memberNumber?: string;
  name: string;
  email?: string;
  label: string;
  type: string;
  amountCents: number;
  /** Mode de paiement en clair (« Carte bancaire », « Espèces »…), jamais de détail */
  methodLabel: string;
  issuedAt: string;
}

export const invoices = collection<Invoice>("invoices");
export const invoiceKey = (id: string) => `invoice-${id}`;

/** Mode de paiement affiché : uniquement le type, sans aucun détail. */
export function methodPublic(method: string) {
  const m = method.toLowerCase();
  if (m.includes("carte")) return "Carte bancaire";
  if (m.includes("esp")) return "Espèces";
  if (m.includes("virement")) return "Virement bancaire";
  if (m.includes("chèque") || m.includes("cheque")) return "Chèque";
  return "Autre moyen de paiement";
}

const W = 595.28;
const H = 841.89;
const NAVY = rgb(0.012, 0.035, 0.098);
const RED = rgb(0.851, 0.059, 0.173);
const GREY = rgb(0.42, 0.45, 0.52);
const INK = rgb(0.06, 0.08, 0.13);
const LIGHT = rgb(0.95, 0.96, 0.98);
const WHITE = rgb(1, 1, 1);

const safe = (font: PDFFont, t: string) => {
  const set = new Set(font.getCharacterSet());
  return [...t.replace(/[’‘]/g, "'").replace(/[“”]/g, '"').replace(/[‐-―]/g, "-").replace(/[  ]/g, " ")].map((c) => (set.has(c.codePointAt(0)!) ? c : "?")).join("");
};

const fmt = (iso: string) => {
  const [y, m, d] = iso.slice(0, 10).split("-");
  return `${d}/${m}/${y}`;
};

/** Image d'une adresse de la médiathèque (/medias/<id>) : PNG ou JPEG uniquement (formats gérés par le PDF). */
async function mediaImage(doc: PDFDocument, url?: string): Promise<PDFImage | null> {
  const id = url?.match(/^\/medias\/([\w-]+)$/)?.[1];
  if (!id) return null;
  const blob = await getBlob(mediaKey(id));
  if (!blob) return null;
  try {
    if (blob.mime === "image/png") return await doc.embedPng(blob.bytes);
    if (blob.mime === "image/jpeg") return await doc.embedJpg(blob.bytes);
  } catch {
    /* image illisible : la facture est éditée sans */
  }
  return null;
}

export async function buildInvoicePdf(inv: Invoice, asso: AssociationInfo, conf: Awaited<ReturnType<typeof settings.get>>["invoice"], client: { address?: string }): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.setTitle(`Facture ${inv.number}`);
  doc.setAuthor(asso.legalName);
  const page: PDFPage = doc.addPage([W, H]);
  const reg = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const top = (t: number) => H - t;
  const text = (t: string, x: number, at: number, size: number, o: { font?: PDFFont; color?: ReturnType<typeof rgb>; align?: "left" | "right" | "center" } = {}) => {
    const font = o.font ?? reg;
    const s = safe(font, t);
    const w = font.widthOfTextAtSize(s, size);
    page.drawText(s, { x: o.align === "right" ? x - w : o.align === "center" ? x - w / 2 : x, y: top(at) - size * 0.8, size, font, color: o.color ?? INK });
  };

  // Bandeau
  page.drawRectangle({ x: 0, y: top(120), width: W, height: 120, color: NAVY });
  page.drawRectangle({ x: 0, y: top(124), width: W * 0.34, height: 4, color: rgb(0.106, 0.247, 0.561) });
  page.drawRectangle({ x: W * 0.34, y: top(124), width: W * 0.33, height: 4, color: RED });
  page.drawRectangle({ x: W * 0.67, y: top(124), width: W * 0.33, height: 4, color: WHITE });
  const logo = await doc.embedPng(Buffer.from(LOGO_COLOR_PNG, "base64"));
  page.drawImage(logo, { x: 40, y: top(102), width: 70, height: 70 });
  text(asso.legalName.toUpperCase(), 126, 44, 13, { font: bold, color: WHITE });
  text(`${asso.address} - ${asso.postalCode} ${asso.city}`, 126, 62, 8.5, { color: rgb(0.78, 0.82, 0.9) });
  text(`SIRET ${asso.siret} - RNA ${asso.rna}`, 126, 75, 8.5, { color: rgb(0.78, 0.82, 0.9) });
  text(`${asso.email} - ${asso.website}`, 126, 88, 8.5, { color: rgb(0.78, 0.82, 0.9) });
  text("FACTURE", W - 40, 40, 24, { font: bold, color: WHITE, align: "right" });
  text(`N° ${inv.number}`, W - 40, 72, 11, { color: WHITE, align: "right" });

  // Références
  text("Date d'émission", 40, 150, 8, { color: GREY });
  text(fmt(inv.issuedAt), 40, 162, 11, { font: bold });
  text("Mode de paiement", 190, 150, 8, { color: GREY });
  text(inv.methodLabel, 190, 162, 11, { font: bold });
  text("Statut", 360, 150, 8, { color: GREY });
  text("ACQUITTÉE", 360, 162, 11, { font: bold, color: RED });

  // Client
  page.drawRectangle({ x: 40, y: top(262), width: W - 80, height: 74, color: LIGHT });
  text("FACTURÉ À", 54, 200, 8, { color: GREY });
  text(inv.name, 54, 214, 13, { font: bold });
  if (inv.memberNumber) text(`Membre n° ${inv.memberNumber}`, 54, 233, 9, { color: GREY });
  if (client.address) text(client.address, 54, 246, 9, { color: GREY });

  // Lignes
  page.drawRectangle({ x: 40, y: top(328), width: W - 80, height: 24, color: NAVY });
  text("DÉSIGNATION", 54, 310, 8.5, { font: bold, color: WHITE });
  text("TYPE", 360, 310, 8.5, { font: bold, color: WHITE });
  text("MONTANT", W - 54, 310, 8.5, { font: bold, color: WHITE, align: "right" });
  text(inv.label.slice(0, 70), 54, 342, 10.5);
  text(inv.type, 360, 342, 10);
  text(eur(inv.amountCents), W - 54, 342, 10.5, { font: bold, align: "right" });
  page.drawLine({ start: { x: 40, y: top(366) }, end: { x: W - 40, y: top(366) }, thickness: 0.6, color: GREY });

  // Total
  page.drawRectangle({ x: W - 250, y: top(432), width: 210, height: 44, color: LIGHT });
  text("TOTAL PAYÉ", W - 238, 398, 9, { color: GREY });
  text(eur(inv.amountCents), W - 52, 410, 17, { font: bold, align: "right" });
  // Mention légale : renvoyée à la ligne dans la colonne de gauche (elle ne passe jamais sous le total).
  let ny = 388;
  let line = "";
  for (const word of safe(reg, conf.legalNote).split(" ")) {
    if (reg.widthOfTextAtSize(`${line} ${word}`.trim(), 8.5) > 250) {
      text(line, 40, ny, 8.5, { color: GREY });
      ny += 12;
      line = word;
    } else line = `${line} ${word}`.trim();
  }
  if (line) text(line, 40, ny, 8.5, { color: GREY });
  text(`Réglé le ${fmt(inv.issuedAt)} par ${inv.methodLabel.toLowerCase()}.`, 40, ny + 16, 8.5, { color: GREY });

  // Cachet et signature
  text(`Fait à ${asso.city}, le ${fmt(inv.issuedAt)}`, 40, 490, 10);
  text("Pour l'association :", 40, 506, 9, { color: GREY });
  const stamp = await mediaImage(doc, conf.stamp);
  const sign = await mediaImage(doc, conf.signature);
  if (stamp) {
    const s = Math.min(120 / stamp.width, 120 / stamp.height);
    page.drawImage(stamp, { x: 40, y: top(520) - stamp.height * s, width: stamp.width * s, height: stamp.height * s, opacity: 0.92 });
  }
  if (sign) {
    const s = Math.min(150 / sign.width, 70 / sign.height);
    page.drawImage(sign, { x: 190, y: top(520) - sign.height * s, width: sign.width * s, height: sign.height * s });
  }
  const signer = conf.signerName || asso.president;
  const signerTitle = conf.signerTitle || asso.presidentTitle;
  text(signer, 190, 620, 10.5, { font: bold });
  text(signerTitle, 190, 634, 9, { color: GREY });
  page.drawLine({ start: { x: 190, y: top(616) }, end: { x: 340, y: top(616) }, thickness: 0.5, color: GREY });

  // Pied
  page.drawLine({ start: { x: 40, y: top(770) }, end: { x: W - 40, y: top(770) }, thickness: 0.6, color: GREY });
  text(`${asso.legalName.toUpperCase()} - ${asso.address} - ${asso.postalCode} ${asso.city.toUpperCase()}`, W / 2, 780, 7.5, { align: "center", color: GREY });
  text(`${asso.form} - SIRET ${asso.siret} - RNA ${asso.rna} - ${asso.email}`, W / 2, 792, 7.5, { align: "center", color: GREY });
  text("Facture générée automatiquement, valable sans signature manuscrite.", W / 2, 806, 7, { align: "center", color: GREY });
  return doc.save();
}

/** Une seule édition de facture à la fois dans ce processus (numéros sans doublon ; pas d'usage de la file d'écriture de la base : elle n'est pas ré-entrante). */
let chain: Promise<unknown> = Promise.resolve();
const serial = <T>(fn: () => Promise<T>): Promise<T> => {
  const run = chain.then(fn, fn);
  chain = run.catch(() => undefined);
  return run;
};

/** Prochain numéro de l'année : FAC-2026-0001, FAC-2026-0002… (sans trou ni doublon, même en cas de paiements simultanés). */
const nextNumber = (prefix: string, year: number, all: Invoice[]) => {
  const seq = Math.max(0, ...all.filter((i) => i.year === year).map((i) => i.seq)) + 1;
  return { seq, number: `${prefix}-${year}-${String(seq).padStart(4, "0")}` };
};

async function adminEmails() {
  const overrides = (await settings.get()).rolePermissions;
  return (await admins.all()).filter((a) => a.active && effectivePermissions(a.role, overrides).has("finance.view")).map((a) => a.email);
}

/**
 * Édite la facture d'une transaction payée (une seule fois par transaction) et, sauf `silent`, en informe la personne et les
 * administratrices par e-mail avec la facture en pièce jointe. Ne lève jamais d'erreur : un échec est simplement consigné.
 */
export async function issueInvoice(txId: string, opts: { silent?: boolean } = {}): Promise<Invoice | null> {
  try {
    const existing = await invoices.findOne((i) => i.txId === txId);
    if (existing) return existing;
    const tx = (await getTransactions()).find((t) => t.id === txId);
    if (!tx || tx.status !== "paid" || tx.amountCents <= 0) return null;
    const conf = await settings.get();
    const created = await serial(async () => {
      const dup = await invoices.findOne((i) => i.txId === txId);
      if (dup) return { inv: dup, fresh: false };
      const all = await invoices.all();
      const year = new Date().getFullYear();
      const { seq, number } = nextNumber(conf.invoice.prefix || "FAC", year, all);
      const inv = await invoices.insert({
        number, year, seq, txId,
        memberNumber: tx.memberNumber,
        name: tx.name,
        email: tx.email,
        label: tx.label,
        type: tx.type,
        amountCents: tx.amountCents,
        methodLabel: methodPublic(tx.method),
        issuedAt: new Date().toISOString(),
      });
      return { inv, fresh: true };
    });
    if (!created.fresh) return created.inv;
    const inv = created.inv;
    const member = tx.memberNumber ? await getMemberByNumber(tx.memberNumber) : null;
    const address = member ? `${member.address.line1}${member.address.line2 ? `, ${member.address.line2}` : ""}, ${member.address.postalCode} ${member.address.city}` : undefined;
    const bytes = Buffer.from(await buildInvoicePdf(inv, conf.association, conf.invoice, { address }));
    await putBlob(invoiceKey(inv.id), bytes, "application/pdf");
    if (!opts.silent) await notifyInvoice(inv, tx, member?.firstName);
    return inv;
  } catch {
    return null;
  }
}

/** Met en file les e-mails de validation de paiement (personne + administratrices) : la facture est jointe au moment de l'envoi, avec nouvelles tentatives en cas d'échec. */
async function notifyInvoice(inv: Invoice, tx: Tx, firstName?: string) {
  const vars = { prenom: firstName ?? inv.name.split(" ")[0], nom: inv.name, montant: eur(inv.amountCents), objet: tx.label, numero: inv.number, mode: inv.methodLabel };
  if (inv.email) await enqueueEmail({ type: "INVOICE_ISSUED", recipient: inv.email, dedupeKey: `INVOICE_ISSUED:${inv.id}`, memberNumber: inv.memberNumber, payload: { invoiceId: inv.id, vars } });
  for (const to of new Set(await adminEmails())) await enqueueEmail({ type: "INVOICE_ADMIN", recipient: to, dedupeKey: `INVOICE_ADMIN:${inv.id}:${to}`, payload: { invoiceId: inv.id, vars } });
  processEmailJobsSoon();
}

/** Édite (sans envoi d'e-mail) les factures des paiements déjà validés avant la mise en place du module. */
export async function issueMissingInvoices() {
  let n = 0;
  for (const tx of (await getTransactions()).filter((t) => t.status === "paid" && t.amountCents > 0)) {
    if (!(await invoices.findOne((i) => i.txId === tx.id))) if (await issueInvoice(tx.id, { silent: true })) n++;
  }
  return n;
}

export const newInvoiceId = () => randomUUID();
