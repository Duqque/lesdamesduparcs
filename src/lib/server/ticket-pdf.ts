import "server-only";
import QRCode from "qrcode";
import { PDFDocument, PDFName, PDFString, StandardFonts, degrees, rgb, type PDFFont, type PDFImage, type PDFPage } from "pdf-lib";
import { code128, code128Width } from "@/lib/code128";
import type { AssociationInfo } from "./admin-store";
import { LOGO_COLOR_PNG } from "./pdf-assets";

/**
 * Billet électronique au format téléphone (360 pt de large) : bandeau, photo de l'événement, match relié (clubs, logos, compétition),
 * date et heure en grand, lieu avec lien d'itinéraire, titulaire, code-barres unique (contrôle à l'entrée), QR code de la carte de
 * l'adhérente, conditions d'utilisation et coordonnées de l'association. Mise en page inspirée des e-billets de salle.
 */
/** Proportions de la photo du billet (largeur / hauteur). */
export const TICKET_PHOTO_RATIO = 360 / 150;

export interface TicketData {
  code: string;
  event: { title: string; summary?: string; tag?: string; date: string; time?: string; endTime?: string; venue: string; address?: string; city?: string; mapsUrl: string };
  match?: { home: string; away: string; competition?: string; homeLogo?: Uint8Array | null; awayLogo?: Uint8Array | null; competitionLogo?: Uint8Array | null; time?: string };
  photo?: Uint8Array | null;
  holder: { firstName: string; lastName: string; birthDate?: string; memberNumber: string; places: number; amountCents: number; status: string };
  memberQr?: string;
  cancellationPolicy?: string;
  asso: AssociationInfo;
  issuedAt: string;
}

const W = 360;
const H = 1400; // page haute, recadrée à la fin sur le contenu réel
const M = 18;
const NAVY = rgb(0.012, 0.035, 0.098);
const NAVY_2 = rgb(0.043, 0.075, 0.153);
const BLUE = rgb(0.106, 0.247, 0.561);
const RED = rgb(0.851, 0.059, 0.173);
const PALE = rgb(0.925, 0.941, 0.976);
const LINE = rgb(0.78, 0.81, 0.87);
const GREY = rgb(0.42, 0.45, 0.52);
const INK = rgb(0.06, 0.08, 0.13);
const WHITE = rgb(1, 1, 1);
type Color = ReturnType<typeof rgb>;

interface Ctx {
  doc: PDFDocument;
  page: PDFPage;
  reg: PDFFont;
  bold: PDFFont;
}

const Y = (top: number) => H - top;
const safe = (font: PDFFont, t: string) => {
  const set = new Set(font.getCharacterSet());
  return [...t.replace(/[’‘]/g, "'").replace(/[“”«»]/g, '"').replace(/[‐-―]/g, "-").replace(/[  ]/g, " ")].map((c) => (set.has(c.codePointAt(0)!) ? c : "?")).join("");
};

function text(c: Ctx, t: string, x: number, top: number, size: number, o: { font?: PDFFont; color?: Color; align?: "left" | "center" | "right"; spacing?: number; maxW?: number } = {}) {
  const font = o.font ?? c.reg;
  let s = safe(font, t);
  let sz = size;
  const width = (str: string, z: number) => font.widthOfTextAtSize(str, z) + (o.spacing ?? 0) * Math.max(str.length - 1, 0);
  if (o.maxW) while (sz > 5 && width(s, sz) > o.maxW) sz -= 0.25;
  if (o.maxW && width(s, sz) > o.maxW) while (s.length > 1 && width(`${s}…`, sz) > o.maxW) s = s.slice(0, -1);
  const w = width(s, sz);
  const dx = o.align === "center" ? -w / 2 : o.align === "right" ? -w : 0;
  if (o.spacing) {
    let cx = x + dx;
    for (const ch of s) {
      c.page.drawText(ch, { x: cx, y: Y(top) - sz * 0.8, size: sz, font, color: o.color ?? INK });
      cx += font.widthOfTextAtSize(ch, sz) + o.spacing;
    }
  } else c.page.drawText(s, { x: x + dx, y: Y(top) - sz * 0.8, size: sz, font, color: o.color ?? INK });
  return w;
}

/** Texte sur plusieurs lignes ; retourne la position sous le bloc. */
function wrap(c: Ctx, t: string, x: number, top: number, width: number, size: number, lead: number, o: { font?: PDFFont; color?: Color; maxLines?: number; align?: "left" | "center" } = {}) {
  const font = o.font ?? c.reg;
  const lines: string[] = [];
  for (const para of t.split(/\n/)) {
    let line = "";
    for (const word of para.split(/\s+/).filter(Boolean)) {
      const next = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(safe(font, next), size) > width && line) {
        lines.push(line);
        line = word;
      } else line = next;
    }
    lines.push(line);
  }
  const shown = o.maxLines ? lines.slice(0, o.maxLines) : lines;
  if (o.maxLines && lines.length > o.maxLines) shown[shown.length - 1] = `${shown[shown.length - 1].replace(/\s+\S*$/, "")}…`;
  let cur = top;
  for (const l of shown) {
    text(c, l, o.align === "center" ? x + width / 2 : x, cur, size, { font, color: o.color, align: o.align });
    cur += lead;
  }
  return cur;
}

function box(c: Ctx, x: number, top: number, w: number, h: number, r: number, s: { fill?: Color; stroke?: Color; lineWidth?: number; opacity?: number }) {
  const d = `M${r} 0 H${w - r} Q${w} 0 ${w} ${r} V${h - r} Q${w} ${h} ${w - r} ${h} H${r} Q0 ${h} 0 ${h - r} V${r} Q0 0 ${r} 0 Z`;
  c.page.drawSvgPath(d, { x, y: Y(top), color: s.fill, opacity: s.opacity, borderColor: s.stroke, borderWidth: s.stroke ? (s.lineWidth ?? 0.8) : 0 });
}

function qr(c: Ctx, value: string, x: number, top: number, size: number, color = NAVY) {
  const { modules } = QRCode.create(value, { errorCorrectionLevel: "M" });
  const n = modules.size;
  const pad = 3;
  const cell = (size - pad * 2) / n;
  c.page.drawRectangle({ x, y: Y(top) - size, width: size, height: size, color: WHITE });
  for (let r = 0; r < n; r++) for (let col = 0; col < n; col++) if (modules.data[r * n + col]) c.page.drawRectangle({ x: x + pad + col * cell, y: Y(top + pad + r * cell) - cell, width: cell + 0.15, height: cell + 0.15, color });
}

function barcode(c: Ctx, value: string, x: number, top: number, width: number, height: number) {
  const widths = code128(value);
  const quiet = 10;
  const unit = width / (code128Width(widths) + quiet * 2);
  c.page.drawRectangle({ x, y: Y(top) - height, width, height, color: WHITE });
  let cx = x + quiet * unit;
  widths.forEach((n, i) => {
    if (i % 2 === 0) c.page.drawRectangle({ x: cx, y: Y(top) - height, width: n * unit, height, color: rgb(0, 0, 0) });
    cx += n * unit;
  });
}

/** Lien cliquable (ex. itinéraire Google Maps) sur une zone de la page. */
function link(c: Ctx, url: string, x: number, top: number, w: number, h: number) {
  const annot = c.doc.context.obj({
    Type: "Annot",
    Subtype: "Link",
    Rect: [x, Y(top + h), x + w, Y(top)],
    Border: [0, 0, 0],
    A: { Type: "Action", S: "URI", URI: PDFString.of(url) },
  });
  const ref = c.doc.context.register(annot);
  const annots = c.page.node.lookup(PDFName.of("Annots"));
  if (annots && "push" in annots) (annots as unknown as { push: (r: unknown) => void }).push(ref);
  else c.page.node.set(PDFName.of("Annots"), c.doc.context.obj([ref]));
}

const DAYS = ["DIMANCHE", "LUNDI", "MARDI", "MERCREDI", "JEUDI", "VENDREDI", "SAMEDI"];
const MONTHS = ["JANVIER", "FÉVRIER", "MARS", "AVRIL", "MAI", "JUIN", "JUILLET", "AOÛT", "SEPTEMBRE", "OCTOBRE", "NOVEMBRE", "DÉCEMBRE"];
const longDate = (iso: string) => {
  const d = new Date(`${iso.slice(0, 10)}T12:00:00Z`);
  return `${DAYS[d.getUTCDay()]} ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
};
const shortDate = (iso: string) => iso.slice(0, 10).split("-").reverse().join("/");
const hour = (t?: string) => (t ? t.replace(":", "H") : "");
const euros = (cents: number) => (cents ? `${(cents / 100).toFixed(2).replace(".", ",")} €` : "Gratuit");

async function embed(doc: PDFDocument, bytes?: Uint8Array | null, kind: "png" | "jpg" = "png"): Promise<PDFImage | null> {
  if (!bytes) return null;
  try {
    return kind === "jpg" ? await doc.embedJpg(bytes) : await doc.embedPng(bytes);
  } catch {
    return null;
  }
}

/** Logo de club (ou initiales à défaut) centré dans un carré. */
function logoBox(c: Ctx, img: PDFImage | null, name: string, cx: number, top: number, size: number) {
  box(c, cx - size / 2, top, size, size, 10, { fill: WHITE, stroke: LINE, lineWidth: 0.6 });
  if (img) {
    const s = Math.min((size - 10) / img.width, (size - 10) / img.height);
    c.page.drawImage(img, { x: cx - (img.width * s) / 2, y: Y(top + size / 2) - (img.height * s) / 2, width: img.width * s, height: img.height * s });
  } else {
    const initials = name.split(/\s+/).filter((w) => w.length > 2 || /^[A-Z]{2,}$/.test(w)).map((w) => w[0]).join("").slice(0, 3).toUpperCase() || name.slice(0, 2).toUpperCase();
    text(c, initials, cx, top + size / 2 - 7, 14, { font: c.bold, align: "center", color: NAVY });
  }
}

/** Petits pictogrammes vectoriels des conditions d'utilisation. */
function icon(c: Ctx, kind: "barcode" | "person" | "id" | "warning" | "euro", x: number, top: number) {
  const col = BLUE;
  if (kind === "barcode") for (const [dx, w] of [[0, 1.2], [2.4, 0.6], [3.8, 1.6], [6.4, 0.6], [7.8, 1.2], [10, 0.6], [11.4, 1.8], [14.2, 0.6], [15.6, 1.2], [17.8, 0.8]] as const) c.page.drawRectangle({ x: x + dx, y: Y(top + 14), width: w, height: 14, color: col });
  if (kind === "person") {
    c.page.drawCircle({ x: x + 9, y: Y(top + 5), size: 4, borderColor: col, borderWidth: 1 });
    c.page.drawSvgPath("M0 10 C0 3 18 3 18 10", { x, y: Y(top + 7), borderColor: col, borderWidth: 1 });
  }
  if (kind === "id") {
    box(c, x, top + 1, 20, 13, 2, { stroke: col, lineWidth: 1 });
    c.page.drawCircle({ x: x + 6, y: Y(top + 6), size: 2.2, borderColor: col, borderWidth: 0.8 });
    for (const dy of [5, 8, 11]) c.page.drawLine({ start: { x: x + 11, y: Y(top + dy) }, end: { x: x + 17, y: Y(top + dy) }, thickness: 0.8, color: col });
  }
  if (kind === "warning") {
    c.page.drawSvgPath("M9 0 L18 15 L0 15 Z", { x, y: Y(top), borderColor: RED, borderWidth: 1 });
    c.page.drawLine({ start: { x: x + 9, y: Y(top + 5) }, end: { x: x + 9, y: Y(top + 10) }, thickness: 1.1, color: RED });
    c.page.drawCircle({ x: x + 9, y: Y(top + 12.5), size: 0.7, color: RED });
  }
  if (kind === "euro") {
    c.page.drawCircle({ x: x + 9, y: Y(top + 8), size: 8, borderColor: col, borderWidth: 1 });
    text(c, "€", x + 9, top + 3, 9, { font: c.bold, align: "center", color: col });
  }
}

export async function buildTicketPdf(t: TicketData) {
  const doc = await PDFDocument.create();
  doc.setTitle(`Billet ${t.code} - ${t.event.title}`);
  doc.setAuthor(t.asso.legalName || t.asso.name);
  doc.setCreator(t.asso.website);
  const page = doc.addPage([W, H]);
  const c: Ctx = { doc, page, reg: await doc.embedFont(StandardFonts.Helvetica), bold: await doc.embedFont(StandardFonts.HelveticaBold) };
  const logo = await doc.embedPng(Buffer.from(LOGO_COLOR_PNG, "base64"));
  const photo = await embed(doc, t.photo, "jpg");
  const homeLogo = await embed(doc, t.match?.homeLogo);
  const awayLogo = await embed(doc, t.match?.awayLogo);
  const compLogo = await embed(doc, t.match?.competitionLogo);
  page.drawRectangle({ x: 0, y: 0, width: W, height: H, color: WHITE });

  // 1. Bandeau
  page.drawRectangle({ x: 0, y: Y(66), width: W, height: 66, color: NAVY });
  page.drawImage(logo, { x: M, y: Y(56), width: 46, height: 46 });
  text(c, "LES DAMES DU PARC", 74, 18, 12.5, { font: c.bold, color: WHITE, spacing: 0.6 });
  text(c, "E-BILLET · ÉVÉNEMENT DES MEMBRES", 74, 36, 7, { font: c.bold, color: rgb(1, 0.42, 0.5), spacing: 0.8 });
  text(c, `Billet n° ${t.code.slice(-6)}`, W - M, 18, 7.5, { color: rgb(0.75, 0.8, 0.9), align: "right" });
  page.drawRectangle({ x: 0, y: Y(69), width: W, height: 3, color: RED });

  // 2. Photo de l'événement
  let top = 69;
  if (photo) {
    // Photo déjà recadrée au format 360 × 150 (voir tickets.ts).
    const h = 150;
    page.drawImage(photo, { x: 0, y: Y(top + h), width: W, height: h });
    page.drawRectangle({ x: 0, y: Y(top + h), width: W, height: 40, color: NAVY, opacity: 0.35 });
    if (t.event.tag) {
      const tw = c.bold.widthOfTextAtSize(safe(c.bold, t.event.tag.toUpperCase()), 7) + 16;
      box(c, M, top + h - 26, tw, 16, 8, { fill: RED });
      text(c, t.event.tag.toUpperCase(), M + 8, top + h - 21.5, 7, { font: c.bold, color: WHITE });
    }
    top += h;
  }

  // 3. Titre
  top += 16;
  top = wrap(c, t.event.title.toUpperCase(), M, top, W - M * 2, 17, 20, { font: c.bold, color: NAVY, maxLines: 3 });
  if (t.event.summary) top = wrap(c, t.event.summary, M, top + 2, W - M * 2, 8.5, 11.5, { color: GREY, maxLines: 2 });

  // 4. Match relié
  if (t.match) {
    top += 10;
    const h = 104;
    box(c, M, top, W - M * 2, h, 10, { fill: PALE });
    text(c, t.match.competition ? `MATCH · ${t.match.competition.toUpperCase()}` : "MATCH DU PARIS SAINT-GERMAIN", M + 12, top + 10, 6.8, { font: c.bold, color: BLUE, spacing: 0.7, maxW: W - M * 2 - 70 });
    if (compLogo) logoBox(c, compLogo, t.match.competition ?? "", W - M - 24, top + 6, 30);
    const cx1 = M + 70;
    const cx2 = W - M - 70;
    logoBox(c, homeLogo, t.match.home, cx1, top + 30, 44);
    logoBox(c, awayLogo, t.match.away, cx2, top + 30, 44);
    text(c, "VS", W / 2, top + 44, 14, { font: c.bold, color: RED, align: "center" });
    if (t.match.time) text(c, hour(t.match.time), W / 2, top + 62, 7.5, { color: GREY, align: "center" });
    text(c, t.match.home, cx1, top + 80, 8.5, { font: c.bold, color: NAVY, align: "center", maxW: 120 });
    text(c, t.match.away, cx2, top + 80, 8.5, { font: c.bold, color: NAVY, align: "center", maxW: 120 });
    top += h;
  }

  // 5. Date et heure (en grand, encadrées)
  top += 12;
  box(c, M, top, W - M * 2, 40, 4, { stroke: NAVY, lineWidth: 1.4 });
  text(c, `${longDate(t.event.date)}${t.event.time ? `  ${hour(t.event.time)}` : ""}`, W / 2, top + 13, 14, { font: c.bold, color: NAVY, align: "center", maxW: W - M * 2 - 16 });
  top += 40;
  text(c, t.event.endTime ? `Ouverture ${hour(t.event.time)} · fin prévue ${hour(t.event.endTime)}` : "Horaire pouvant être modifié par les organisatrices", W / 2, top + 5, 7, { color: GREY, align: "center" });
  top += 18;

  // 6. Cases d'information (comme « Accès / Rang / Place »)
  const cells: Array<[string, string]> = [["PLACES", String(t.holder.places)], ["TARIF", euros(t.holder.amountCents)], ["STATUT", t.holder.status.toUpperCase()]];
  const cw = (W - M * 2 - 12) / 3;
  cells.forEach(([l, v], i) => {
    const x = M + i * (cw + 6);
    text(c, l, x + cw / 2, top, 6.5, { color: GREY, align: "center", spacing: 0.8 });
    box(c, x, top + 10, cw, 30, 3, { stroke: NAVY, lineWidth: 1.1 });
    text(c, v, x + cw / 2, top + 19, 12, { font: c.bold, color: NAVY, align: "center", maxW: cw - 10 });
  });
  top += 52;

  // 7. Lieu et itinéraire
  box(c, M, top, W - M * 2, 78, 8, { fill: NAVY_2 });
  text(c, "LIEU DE L'ÉVÉNEMENT", M + 12, top + 10, 6.8, { font: c.bold, color: rgb(1, 0.42, 0.5), spacing: 0.8 });
  text(c, t.event.venue, M + 12, top + 23, 12, { font: c.bold, color: WHITE, maxW: W - M * 2 - 90 });
  const addr = [t.event.address, t.event.city].filter((x) => x && !/communiqu/i.test(x)).join(", ");
  if (addr) wrap(c, addr, M + 12, top + 40, W - M * 2 - 92, 8, 10, { color: rgb(0.8, 0.84, 0.92), maxLines: 2 });
  const lw = text(c, "Itinéraire Google Maps  ›", M + 12, top + 62, 8.5, { font: c.bold, color: rgb(1, 0.42, 0.5) });
  link(c, t.event.mapsUrl, M + 8, top + 56, lw + 10, 18);
  qr(c, t.event.mapsUrl, W - M - 66, top + 7, 58, NAVY);
  link(c, t.event.mapsUrl, W - M - 66, top + 7, 58, 58);
  text(c, "Itinéraire", W - M - 37, top + 67, 5.5, { color: rgb(0.8, 0.84, 0.92), align: "center" });
  top += 90;

  // 8. Titulaire (cadre au filigrane, comme le bloc client des e-billets)
  const hh = 82;
  box(c, M, top, W - M * 2, hh, 4, { stroke: LINE, lineWidth: 0.8 });
  for (let i = 0; i < 9; i++) page.drawText("LES DAMES DU PARC", { x: M + 4 + (i % 3) * 112, y: Y(top + 16 + Math.floor(i / 3) * 26), size: 7, font: c.bold, color: rgb(0.95, 0.955, 0.975), rotate: degrees(12) });
  const rows: Array<[string, string]> = [
    ["Nom :", t.holder.lastName.toUpperCase()],
    ["Prénom :", t.holder.firstName],
    ["Née le :", t.holder.birthDate ? shortDate(t.holder.birthDate) : "—"],
    ["N° de membre :", t.holder.memberNumber],
  ];
  rows.forEach(([l, v], i) => {
    text(c, l, M + 12, top + 10 + i * 17, 9.5, { font: c.bold, color: INK });
    text(c, v, M + 112, top + 10 + i * 17, 9.5, { font: c.bold, color: NAVY, maxW: W - M * 2 - 124 });
  });
  top += hh + 14;

  // 9. Code-barres (contrôle à l'entrée) et QR code de l'adhérente
  text(c, "CODE DU BILLET · À PRÉSENTER À L'ENTRÉE", W / 2, top, 6.8, { font: c.bold, color: BLUE, align: "center", spacing: 0.8 });
  barcode(c, t.code, M, top + 12, W - M * 2, 58);
  text(c, t.code.replace(/(\d{4})(?=\d)/g, "$1 "), W / 2, top + 74, 11, { font: c.bold, color: INK, align: "center", spacing: 1.5 });
  top += 96;
  if (t.memberQr) {
    qr(c, t.memberQr, M, top, 76);
    text(c, "QR code de l'adhérente", M + 88, top + 12, 9, { font: c.bold, color: NAVY });
    wrap(c, "Il ouvre la preuve d'adhésion de la titulaire. Le code-barres ci-dessus, unique, valide l'entrée : un seul passage par billet.", M + 88, top + 27, W - M * 2 - 88, 7.5, 10, { color: GREY });
    top += 90;
  }

  // 10. Conditions d'utilisation
  box(c, M, top, W - M * 2, 26, 13, { fill: NAVY });
  text(c, "CONDITIONS D'UTILISATION", W / 2, top + 8, 10, { font: c.bold, color: WHITE, align: "center", spacing: 1.2 });
  top += 36;
  const rules: Array<[Parameters<typeof icon>[1], string]> = [
    ["barcode", "Chaque e-billet est muni d'un code-barres unique permettant l'accès à l'événement à une seule personne."],
    ["person", "Billet nominatif : seule la titulaire de ce billet pourra accéder à l'événement."],
    ["id", "Une pièce d'identité ou la carte de membre pourra être demandée à l'entrée."],
    ...(t.cancellationPolicy ? ([["euro", t.cancellationPolicy.replace(/\s*\n+\s*/g, " ")]] as Array<[Parameters<typeof icon>[1], string]>) : []),
    ["warning", "En cas de perte, de vol ou de duplication, la titulaire demeure responsable de l'utilisation de son billet : seul le premier passage est accepté."],
  ];
  for (const [k, r] of rules) {
    icon(c, k, M + 4, top);
    const end = wrap(c, r, M + 36, top, W - M * 2 - 40, 7.6, 10, { color: INK });
    top = Math.max(end, top + 18) + 6;
    page.drawLine({ start: { x: M + 36, y: Y(top - 3) }, end: { x: W - M, y: Y(top - 3) }, thickness: 0.4, color: LINE });
    top += 4;
  }

  // 11. Association
  top += 6;
  page.drawLine({ start: { x: M, y: Y(top) }, end: { x: W - M, y: Y(top) }, thickness: 0.6, color: GREY });
  top += 8;
  const a = t.asso;
  const lines = [
    `${(a.legalName || a.name).toUpperCase()} · ${a.address}, ${a.postalCode} ${a.city.toUpperCase()}`,
    [a.siret && `SIRET ${a.siret}`, a.form, a.rna && `RNA ${a.rna}`].filter(Boolean).join(" · "),
    [a.website, a.email].filter(Boolean).join(" · "),
    `Billet émis le ${shortDate(t.issuedAt)} · n° ${t.code}`,
  ];
  for (const l of lines) {
    text(c, l, W / 2, top, 6.8, { color: BLUE, align: "center", maxW: W - M * 2 });
    top += 10;
  }
  top += 10;

  // Recadrage de la page sur le contenu
  page.setMediaBox(0, H - top, W, top);
  page.setCropBox(0, H - top, W, top);
  return doc.save();
}
