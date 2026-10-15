import "server-only";
import QRCode from "qrcode";
import { PDFDocument, PDFName, PDFString, StandardFonts, rgb, type PDFFont, type PDFImage, type PDFPage } from "pdf-lib";
import { code128, code128Width } from "@/lib/code128";
import type { AssociationInfo } from "./admin-store";
import { LOGO_COLOR_PNG } from "./pdf-assets";

/**
 * E-billet au format téléphone (360 pt de large), sur le modèle des e-tickets de stade : fond bleu nuit, bandeau photo avec le logo
 * de l'association, « E-TICKET » et bande de saison ; souche blanche avec code-barres, affiche du match (clubs et logos), date, lieu,
 * cases d'accès, tarif et titulaire ; informations utiles cochées, « Bon match ! », slogan, conditions et coordonnées de l'association.
 */

/** Proportions de la photo du bandeau (largeur / hauteur). */
export const TICKET_PHOTO_RATIO = 360 / 230;

export interface TicketData {
  code: string;
  event: { title: string; summary?: string; tag?: string; date: string; time?: string; endTime?: string; venue: string; address?: string; city?: string; mapsUrl: string };
  match?: { home: string; away: string; competition?: string; homeLogo?: Uint8Array | null; awayLogo?: Uint8Array | null; competitionLogo?: Uint8Array | null; time?: string };
  photo?: Uint8Array | null;
  holder: { firstName: string; lastName: string; birthDate?: string; memberNumber: string; places: number; amountCents: number; status: string };
  memberQr?: string;
  /** Événement réservé aux adhérentes : n° de membre, date de naissance et QR code de la carte figurent sur le billet. Sinon (ouvert à toutes), billet simplifié. */
  membersOnly?: boolean;
  cancellationPolicy?: string;
  asso: AssociationInfo;
  issuedAt: string;
  season?: string;
}

const W = 360;
const H = 1600; // page haute, recadrée à la fin sur le contenu réel
const M = 14;
const NAVY = rgb(0.012, 0.035, 0.098);
const RED = rgb(0.851, 0.059, 0.173);
const RED_SOFT = rgb(1, 0.42, 0.5);
const MIST = rgb(0.72, 0.77, 0.87);
const GREY = rgb(0.42, 0.45, 0.52);
const LINE = rgb(0.82, 0.85, 0.9);
const INK = rgb(0.03, 0.05, 0.1);
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

function text(c: Ctx, t: string, x: number, top: number, size: number, o: { font?: PDFFont; color?: Color; align?: "left" | "center" | "right"; spacing?: number; maxW?: number; opacity?: number } = {}) {
  const font = o.font ?? c.reg;
  let s = safe(font, t);
  let sz = size;
  const width = (str: string, z: number) => font.widthOfTextAtSize(str, z) + (o.spacing ?? 0) * Math.max(str.length - 1, 0);
  if (o.maxW) while (sz > 5 && width(s, sz) > o.maxW) sz -= 0.25;
  if (o.maxW && width(s, sz) > o.maxW) while (s.length > 1 && width(`${s}…`, sz) > o.maxW) s = s.slice(0, -1);
  const w = width(s, sz);
  const dx = o.align === "center" ? -w / 2 : o.align === "right" ? -w : 0;
  const base = { y: Y(top) - sz * 0.8, size: sz, font, color: o.color ?? INK, opacity: o.opacity };
  if (o.spacing) {
    let cx = x + dx;
    for (const ch of s) {
      c.page.drawText(ch, { ...base, x: cx });
      cx += font.widthOfTextAtSize(ch, sz) + o.spacing;
    }
  } else c.page.drawText(s, { ...base, x: x + dx });
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

/** Nombre de lignes qu'occupera un texte (pour réserver la place avant de dessiner). */
function countLines(font: PDFFont, t: string, width: number, size: number) {
  let n = 0;
  for (const para of t.split(/\n/)) {
    let line = "";
    n++;
    for (const word of para.split(/\s+/).filter(Boolean)) {
      const next = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(safe(font, next), size) > width && line) {
        n++;
        line = word;
      } else line = next;
    }
  }
  return n;
}

function box(c: Ctx, x: number, top: number, w: number, h: number, r: number, s: { fill?: Color; stroke?: Color; lineWidth?: number; opacity?: number }) {
  const d = r ? `M${r} 0 H${w - r} Q${w} 0 ${w} ${r} V${h - r} Q${w} ${h} ${w - r} ${h} H${r} Q0 ${h} 0 ${h - r} V${r} Q0 0 ${r} 0 Z` : `M0 0 H${w} V${h} H0 Z`;
  c.page.drawSvgPath(d, { x, y: Y(top), color: s.fill, opacity: s.opacity, borderColor: s.stroke, borderWidth: s.stroke ? (s.lineWidth ?? 0.8) : 0 });
}

function qr(c: Ctx, value: string, x: number, top: number, size: number) {
  const { modules } = QRCode.create(value, { errorCorrectionLevel: "M" });
  const n = modules.size;
  const pad = 3;
  const cell = (size - pad * 2) / n;
  c.page.drawRectangle({ x, y: Y(top) - size, width: size, height: size, color: WHITE });
  for (let r = 0; r < n; r++) for (let col = 0; col < n; col++) if (modules.data[r * n + col]) c.page.drawRectangle({ x: x + pad + col * cell, y: Y(top + pad + r * cell) - cell, width: cell + 0.15, height: cell + 0.15, color: NAVY });
}

/** Code-barres horizontal. */
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

/** Code-barres vertical (le long du bord de la souche, comme sur les e-tickets de stade). */
function barcodeVertical(c: Ctx, value: string, x: number, top: number, width: number, height: number) {
  const widths = code128(value);
  const quiet = 8;
  const unit = height / (code128Width(widths) + quiet * 2);
  let cy = top + quiet * unit;
  widths.forEach((n, i) => {
    if (i % 2 === 0) c.page.drawRectangle({ x, y: Y(cy + n * unit), width, height: n * unit, color: rgb(0, 0, 0) });
    cy += n * unit;
  });
}

/** Lien cliquable sur une zone de la page. */
function link(c: Ctx, url: string, x: number, top: number, w: number, h: number) {
  const ref = c.doc.context.register(c.doc.context.obj({ Type: "Annot", Subtype: "Link", Rect: [x, Y(top + h), x + w, Y(top)], Border: [0, 0, 0], A: { Type: "Action", S: "URI", URI: PDFString.of(url) } }));
  const annots = c.page.node.lookup(PDFName.of("Annots"));
  if (annots && "push" in annots) (annots as unknown as { push: (r: unknown) => void }).push(ref);
  else c.page.node.set(PDFName.of("Annots"), c.doc.context.obj([ref]));
}

/** Coche rouge des informations utiles. */
function check(c: Ctx, x: number, top: number) {
  c.page.drawSvgPath("M0 5 L3.6 8.6 L10 1.2", { x, y: Y(top), borderColor: RED, borderWidth: 2 });
}

const DAYS = ["DIMANCHE", "LUNDI", "MARDI", "MERCREDI", "JEUDI", "VENDREDI", "SAMEDI"];
const MONTHS = ["JANVIER", "FÉVRIER", "MARS", "AVRIL", "MAI", "JUIN", "JUILLET", "AOÛT", "SEPTEMBRE", "OCTOBRE", "NOVEMBRE", "DÉCEMBRE"];
const longDate = (iso: string) => {
  const d = new Date(`${iso.slice(0, 10)}T12:00:00Z`);
  return `${DAYS[d.getUTCDay()]} ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
};
const shortDate = (iso: string) => iso.slice(0, 10).split("-").reverse().join("/");
const hour = (t?: string) => (t ? t.replace(":", "H") : "");
const euros = (cents: number) => (cents ? `${(cents / 100).toFixed(2).replace(".", ",")} €` : "-");
/** Saison sportive (juillet à juin) d'une date. */
const seasonOf = (iso: string) => {
  const d = new Date(`${iso.slice(0, 10)}T12:00:00Z`);
  const y = d.getUTCMonth() >= 6 ? d.getUTCFullYear() : d.getUTCFullYear() - 1;
  return `${y}/${y + 1}`;
};

async function embed(doc: PDFDocument, bytes?: Uint8Array | null, kind: "png" | "jpg" = "png"): Promise<PDFImage | null> {
  if (!bytes) return null;
  try {
    return kind === "jpg" ? await doc.embedJpg(bytes) : await doc.embedPng(bytes);
  } catch {
    return null;
  }
}

/** Image contenue dans un carré (proportions conservées). */
function fit(c: Ctx, img: PDFImage, x: number, top: number, size: number, opacity?: number) {
  const s = Math.min(size / img.width, size / img.height);
  c.page.drawImage(img, { x: x + (size - img.width * s) / 2, y: Y(top + size) + (size - img.height * s) / 2, width: img.width * s, height: img.height * s, opacity });
}

export async function buildTicketPdf(t: TicketData) {
  const doc = await PDFDocument.create();
  doc.setTitle(`E-billet ${t.code} - ${t.event.title}`);
  doc.setAuthor(t.asso.legalName || t.asso.name);
  doc.setCreator(t.asso.website);
  const page = doc.addPage([W, H]);
  const c: Ctx = { doc, page, reg: await doc.embedFont(StandardFonts.Helvetica), bold: await doc.embedFont(StandardFonts.HelveticaBold) };
  const logo = await doc.embedPng(Buffer.from(LOGO_COLOR_PNG, "base64"));
  const photo = await embed(doc, t.photo, "jpg");
  const homeLogo = await embed(doc, t.match?.homeLogo);
  const awayLogo = await embed(doc, t.match?.awayLogo);
  const compLogo = await embed(doc, t.match?.competitionLogo);
  const season = t.season ?? seasonOf(t.event.date);
  const kind = (t.event.tag || "Événement").toUpperCase();

  // Fond bleu nuit sur toute la page
  page.drawRectangle({ x: 0, y: 0, width: W, height: H, color: NAVY });

  // 1. Bandeau : photo voilée, grand logo en filigrane, logo de l'association, « E-TICKET », bandes de saison
  const HH = 230;
  if (photo) {
    page.drawImage(photo, { x: 0, y: Y(HH), width: W, height: HH });
    page.drawRectangle({ x: 0, y: Y(HH), width: W, height: HH, color: NAVY, opacity: 0.8 });
  }
  fit(c, logo, W - 230, 40, 300, 0.045);
  // Puce de gauche : logo de la compétition (match relié) ou sigle de l'association
  if (compLogo) {
    box(c, M, 0, 50, 58, 0, { fill: WHITE });
    fit(c, compLogo, M + 6, 8, 38);
  } else {
    box(c, M, 0, 50, 58, 0, { fill: RED });
    text(c, "LDDP", M + 25, 24, 11, { font: c.bold, color: WHITE, align: "center" });
  }
  // Puce grise en haut : type d'événement (comme « 38e journée »)
  box(c, 120, 0, W - 120 - M, 24, 0, { fill: rgb(0.82, 0.85, 0.9) });
  text(c, t.match?.competition ? `${kind} · ${t.match.competition.toUpperCase()}` : kind, 120 + (W - 120 - M) / 2, 8, 9.5, { font: c.bold, color: NAVY, align: "center", maxW: W - 120 - M - 12, spacing: 0.4 });
  // Écusson de l'association
  fit(c, logo, M + 2, 68, 108);
  // « E-TICKET », association et saison
  text(c, "E-TICKET", W - M, 40, 34, { font: c.bold, color: RED, align: "right" });
  text(c, (t.asso.name || "Les Dames du Parc").toUpperCase(), W - M, 80, 11, { font: c.bold, color: WHITE, align: "right", spacing: 0.6 });
  const sw = c.bold.widthOfTextAtSize(safe(c.bold, `SAISON ${season}`), 12) + 22;
  box(c, W - M - sw, 98, sw, 22, 0, { fill: rgb(0, 0, 0) });
  text(c, `SAISON ${season}`, W - M - sw / 2, 103, 12, { font: c.bold, color: RED_SOFT, align: "center" });
  wrap(c, (t.match ? (t.membersOnly ? "Watch party des membres" : "Watch party") : t.event.summary || "Événement").toUpperCase(), W - M - 190, 132, 190, 9.5, 12, { font: c.bold, color: MIST, maxLines: 2, align: "left" });
  // Bande oblique sous l'écusson (comme « Saison 2021/2022 »)
  page.drawSvgPath("M0 0 H160 L146 22 H0 Z", { x: 0, y: Y(HH - 34), color: RED });
  text(c, `${longDate(t.event.date).split(" ")[0]} ${t.event.date.slice(8, 10)}.${t.event.date.slice(5, 7)}${t.event.time ? ` · ${hour(t.event.time)}` : ""}`, M, HH - 29, 10.5, { font: c.bold, color: WHITE });

  // 2. Souche blanche : on calcule d'abord la mise en page, on dessine le fond, puis le contenu.
  const sx = M;
  const sw2 = W - M * 2;
  const stubTop = HH - 4;
  const inner = sx + 14;
  const innerW = sw2 - 14 - 46; // place pour le code-barres vertical à droite
  const ops: Array<() => void> = [];
  const draw = (fn: () => void) => ops.push(fn);
  let y = stubTop + 12;

  const codeTop = y;
  draw(() => text(c, `${t.code}-${t.holder.places}`, inner, codeTop, 8.5, { color: INK }));
  y += 12;
  const barTop = y;
  draw(() => barcode(c, t.code, inner - 4, barTop, 210, 40));
  y += 52;

  // Affiche : clubs du match (ou titre de l'événement)
  if (t.match) {
    const teams: Array<{ name: string; logo: PDFImage | null }> = [{ name: t.match.home, logo: homeLogo }, { name: t.match.away, logo: awayLogo }];
    teams.forEach((tm, i) => {
      const lt = y + i * 30;
      if (tm.logo) draw(() => fit(c, tm.logo!, inner, lt, 24));
      draw(() => text(c, tm.name.toUpperCase(), inner + (tm.logo ? 32 : 0), lt + 3, 18, { font: c.bold, color: INK, maxW: innerW - (tm.logo ? 32 : 0) }));
    });
    y += 64;
  } else {
    const title = t.event.title.toUpperCase();
    const n = Math.min(3, countLines(c.bold, title, innerW, 18));
    const tt = y;
    draw(() => wrap(c, title, inner, tt, innerW, 18, 21, { font: c.bold, color: INK, maxLines: 3 }));
    y += n * 21 + 4;
  }
  const dateTop = y;
  draw(() => text(c, `${longDate(t.event.date)}${t.event.time ? ` À ${hour(t.event.time)}` : ""}`, inner + 10, dateTop, 11.5, { font: c.bold, color: INK, maxW: innerW - 10 }));
  draw(() => text(c, "DATE ET HORAIRE SOUS RÉSERVE DE MODIFICATIONS.", inner, dateTop + 18, 6.5, { font: c.bold, color: INK }));
  y += 34;
  if (t.match) {
    const evTop = y;
    draw(() => text(c, t.event.title.toUpperCase(), inner, evTop, 8.5, { font: c.bold, color: RED, maxW: innerW }));
    y += 18;
  }

  // Lieu (comme « tribune / niveau ») et cases d'accès
  const venueTop = y + 4;
  draw(() => text(c, t.event.venue.toUpperCase(), inner + innerW / 2, venueTop, 15, { font: c.bold, color: INK, align: "center", maxW: innerW }));
  y += 28;
  const cols: Array<[string, string]> = [["ENTRÉE", hour(t.event.time) || "-"], ["PLACES", String(t.holder.places)], ["BILLET", t.code.slice(-6)], ["STATUT", t.holder.status.toUpperCase()]];
  const cw = innerW / cols.length;
  const colTop = y;
  cols.forEach(([l, v], i) => {
    draw(() => text(c, l, inner + cw * i + cw / 2, colTop, 10.5, { font: c.bold, color: INK, align: "center", maxW: cw - 4 }));
    draw(() => text(c, v, inner + cw * i + cw / 2, colTop + 14, 12.5, { font: c.bold, color: INK, align: "center", maxW: cw - 4 }));
  });
  y += 42;
  const tarifTop = y;
  draw(() => text(c, t.membersOnly ? "TARIF ADHÉRENTE" : "TARIF", inner, tarifTop, 10.5, { font: c.bold, color: INK }));
  draw(() => text(c, euros(t.holder.amountCents), inner + innerW, tarifTop, 10.5, { font: c.bold, color: INK, align: "right" }));
  y += 22;

  // Adresse et itinéraire
  const addr = [t.event.address, t.event.city].filter((x) => x && !/communiqu/i.test(x)).join(", ");
  const addrTop = y;
  draw(() => {
    box(c, inner - 2, addrTop, innerW + 4, 60, 6, { stroke: LINE, lineWidth: 0.8 });
    text(c, "ADRESSE", inner + 8, addrTop + 8, 6.5, { font: c.bold, color: RED, spacing: 0.8 });
    wrap(c, addr || t.event.venue, inner + 8, addrTop + 19, innerW - 72, 8.5, 10.5, { font: c.bold, color: INK, maxLines: 2 });
    const lw = text(c, "Itinéraire Google Maps  ›", inner + 8, addrTop + 44, 8, { font: c.bold, color: RED });
    link(c, t.event.mapsUrl, inner + 4, addrTop + 40, lw + 8, 16);
    qr(c, t.event.mapsUrl, inner + innerW - 54, addrTop + 4, 52);
    link(c, t.event.mapsUrl, inner + innerW - 54, addrTop + 4, 52, 52);
  });
  y += 72;

  // Titulaire
  const holderTop = y;
  draw(() => {
    if (t.membersOnly) text(c, `N° MEMBRE : ${t.holder.memberNumber}`, inner, holderTop, 7.5, { font: c.bold, color: INK, maxW: innerW / 2 + 6 });
    else text(c, "PARTICIPANTE", inner, holderTop, 7.5, { font: c.bold, color: INK });
    text(c, `${t.holder.firstName} ${t.holder.lastName}`.toUpperCase(), inner + innerW, holderTop, 9, { font: c.bold, color: INK, align: "right", maxW: innerW / 2 - 12 });
    if (t.membersOnly && t.holder.birthDate) text(c, `Née le ${shortDate(t.holder.birthDate)}`, inner + innerW, holderTop + 12, 7.5, { color: GREY, align: "right" });
  });
  y += 30;

  // QR code de l'adhérente
  if (t.membersOnly && t.memberQr) {
    const qTop = y;
    draw(() => {
      qr(c, t.memberQr!, inner, qTop, 64);
      text(c, "QR CODE DE L'ADHÉRENTE", inner + 74, qTop + 8, 7.5, { font: c.bold, color: NAVY, spacing: 0.4 });
      wrap(c, "Preuve d'adhésion de la titulaire. Le code-barres de ce billet, unique, valide une seule entrée.", inner + 74, qTop + 22, innerW - 74, 7.5, 9.5, { color: GREY });
    });
    y += 74;
  }

  const stubH = y - stubTop + 6;
  box(c, sx, stubTop, sw2, stubH, 8, { fill: WHITE });
  // Encoches de découpe et pointillés
  for (const nt of [stubTop + 70, stubTop + stubH - 70]) {
    page.drawCircle({ x: sx, y: Y(nt), size: 7, color: NAVY });
    page.drawCircle({ x: sx + sw2, y: Y(nt), size: 7, color: NAVY });
  }
  page.drawLine({ start: { x: sx + sw2 - 40, y: Y(stubTop + 10) }, end: { x: sx + sw2 - 40, y: Y(stubTop + stubH - 10) }, thickness: 0.6, color: LINE, dashArray: [3, 3] });
  barcodeVertical(c, t.code, sx + sw2 - 30, stubTop + 20, 20, Math.min(stubH - 40, 320));
  for (const fn of ops) fn();
  let top = stubTop + stubH + 20;

  // 3. Informations utiles (sur fond bleu)
  top = wrap(c, "POUR PROFITER PLEINEMENT DE LA SOIRÉE, VOICI QUELQUES INFORMATIONS UTILES :", M, top, W - M * 2, 10.5, 13.5, { font: c.bold, color: WHITE, align: "center" }) + 10;
  const infos = [
    t.membersOnly ? "Présentez ce billet à l'entrée, sur votre téléphone ou imprimé, avec votre carte de membre." : "Présentez ce billet à l'entrée, sur votre téléphone ou imprimé : son code-barres est contrôlé à l'entrée.",
    "Pour profiter de la soirée en toute sérénité, nous vous conseillons d'arriver un peu en avance.",
    "Billet nominatif : merci de ne partager ni l'adresse ni ce billet.",
    ...(t.cancellationPolicy ? [t.cancellationPolicy.replace(/\s*\n+\s*/g, " ")] : []),
  ];
  for (const info of infos) {
    check(c, M + 4, top + 1);
    top = wrap(c, info, M + 24, top, W - M * 2 - 24, 9, 12, { color: WHITE }) + 7;
  }
  top += 8;
  text(c, t.match ? "BON MATCH !" : "BELLE SOIRÉE !", W / 2, top, 20, { font: c.bold, color: WHITE, align: "center" });
  top += 38;
  text(c, "PLUS QU'UN GROUPE,", W / 2, top, 22, { font: c.bold, color: WHITE, align: "center" });
  text(c, "UNE FAMILLE", W / 2, top + 26, 26, { font: c.bold, color: RED, align: "center" });
  top += 62;
  text(c, "* Voir les conditions d'utilisation ci-dessous", W / 2, top, 7, { color: MIST, align: "center" });
  top += 16;
  page.drawRectangle({ x: M, y: Y(top), width: W - M * 2, height: 0.8, color: RED });
  text(c, "BILLET NOMINATIF : NI ÉCHANGEABLE, NI REVENDABLE, NI CESSIBLE.", W / 2, top + 7, 7, { font: c.bold, color: WHITE, align: "center" });
  top += 22;

  // 4. Conditions d'utilisation (texte serré, comme les e-billets)
  const conditions = [
    "Ce billet électronique est nominatif et personnel : il donne accès à l'événement à la seule titulaire indiquée, sur présentation d'une pièce d'identité si elle est demandée.",
    "Chaque billet porte un code-barres unique : seul le premier passage est accepté, toute copie est refusée. En cas de perte, l'association peut émettre un nouveau billet ; l'ancien est alors annulé et refusé à l'entrée.",
    "Toute sortie peut être considérée comme définitive. L'accès peut être refusé à toute personne ne respectant pas les consignes des organisatrices ou du lieu.",
    t.cancellationPolicy ? "Conditions d'annulation et de remboursement : voir ci-dessus." : "Toute annulation se fait depuis la page de l'événement ou auprès de l'association.",
    "Des photographies peuvent être prises pendant l'événement : leur diffusion respecte les choix exprimés lors de l'inscription.",
  ].join(" ");
  top = wrap(c, conditions, M, top, W - M * 2, 6.6, 8.4, { color: MIST }) + 12;

  // 5. Pied : site et association
  text(c, "Toutes les infos de la soirée sur", W / 2, top, 9, { font: c.bold, color: WHITE, align: "center" });
  top += 13;
  text(c, (t.asso.website || "lesdamesduparc.com").replace(/^https?:\/\//, "").toUpperCase(), W / 2, top, 12, { font: c.bold, color: RED_SOFT, align: "center", spacing: 0.8 });
  top += 22;
  const a = t.asso;
  for (const l of [
    `${(a.legalName || a.name).toUpperCase()} · ${a.address}, ${a.postalCode} ${a.city.toUpperCase()}`,
    [a.siret && `SIRET ${a.siret}`, a.form, a.rna && `RNA ${a.rna}`].filter(Boolean).join(" · "),
    [a.email, `Billet émis le ${shortDate(t.issuedAt)} · n° ${t.code}`].filter(Boolean).join(" · "),
  ]) {
    text(c, l, W / 2, top, 6.3, { color: MIST, align: "center", maxW: W - M * 2 });
    top += 9;
  }
  top += 12;
  page.drawRectangle({ x: 0, y: Y(top + 4), width: W, height: 4, color: RED });
  top += 4;

  page.setMediaBox(0, H - top, W, top);
  page.setCropBox(0, H - top, W, top);
  return doc.save();
}
