import "server-only";
import QRCode from "qrcode";
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import { association as asso } from "@/data/association";
import { guardianRelations, isMinor, type MemberPublic } from "@/lib/members";
import { LOGO_COLOR_PNG, LOGO_PNG } from "./pdf-assets";

const W = 595.28;
const H = 841.89;
const NAVY = rgb(0.024, 0.071, 0.149);
const NAVY_2 = rgb(0.043, 0.118, 0.239);
const RED = rgb(0.851, 0.059, 0.173);
const BLUE = rgb(0.106, 0.247, 0.561);
const GREY = rgb(0.42, 0.45, 0.52);
const INK = rgb(0.06, 0.08, 0.13);
const WHITE = rgb(1, 1, 1);

interface Ctx {
  doc: PDFDocument;
  page: PDFPage;
  reg: PDFFont;
  bold: PDFFont;
  oblique: PDFFont;
}

const fmtDate = (iso: string) => {
  const [y, m, d] = iso.slice(0, 10).split("-");
  return `${d}/${m}/${y}`;
};

async function setup(title: string): Promise<Ctx> {
  const doc = await PDFDocument.create();
  doc.setTitle(title);
  doc.setAuthor(asso.legalName);
  doc.setCreator(asso.website);
  const page = doc.addPage([W, H]);
  return {
    doc,
    page,
    reg: await doc.embedFont(StandardFonts.Helvetica),
    bold: await doc.embedFont(StandardFonts.HelveticaBold),
    oblique: await doc.embedFont(StandardFonts.HelveticaOblique),
  };
}

/** Les polices standard ne couvrent que le latin de base : les autres caractères sont remplacés. */
const safe = (font: PDFFont, text: string) => {
  const set = new Set(font.getCharacterSet());
  return [...text.replace(/[’‘]/g, "'").replace(/[“”]/g, '"').replace(/[‐-―]/g, "-").replace(/ | /g, " ")].map((c) => (set.has(c.codePointAt(0)!) ? c : "?")).join("");
};

const y = (top: number) => H - top;

function text(c: Ctx, t: string, x: number, top: number, size: number, opts: { font?: PDFFont; color?: ReturnType<typeof rgb>; align?: "left" | "center" | "right"; width?: number } = {}) {
  const font = opts.font ?? c.reg;
  const s = safe(font, t);
  const w = font.widthOfTextAtSize(s, size);
  const dx = opts.align === "center" ? -w / 2 : opts.align === "right" ? -w : 0;
  c.page.drawText(s, { x: x + dx, y: y(top) - size * 0.8, size, font, color: opts.color ?? INK });
  return w;
}

type Run = { t: string; bold?: boolean };

/** Paragraphe justifié à gauche avec passages en gras. Retourne la position (top) après le bloc. */
function paragraph(c: Ctx, runs: Run[], x: number, top: number, width: number, size: number, lead: number) {
  const words: Array<{ t: string; bold: boolean }> = [];
  for (const r of runs) for (const w of r.t.split(/(\s+)/)) if (w) words.push({ t: w, bold: Boolean(r.bold) });
  let line: typeof words = [];
  let lineW = 0;
  let cursor = top;
  const flush = () => {
    let cx = x;
    for (const w of line) {
      const font = w.bold ? c.bold : c.reg;
      const s = safe(font, w.t);
      c.page.drawText(s, { x: cx, y: y(cursor) - size * 0.8, size, font, color: INK });
      cx += font.widthOfTextAtSize(s, size);
    }
    cursor += lead;
    line = [];
    lineW = 0;
  };
  for (const w of words) {
    const font = w.bold ? c.bold : c.reg;
    const ww = font.widthOfTextAtSize(safe(font, w.t), size);
    if (/^\s+$/.test(w.t) && lineW === 0) continue;
    if (lineW + ww > width && !/^\s+$/.test(w.t)) flush();
    if (/^\s+$/.test(w.t) && lineW === 0) continue;
    line.push(w);
    lineW += ww;
  }
  if (line.length) flush();
  return cursor;
}

function roundRect(c: Ctx, x: number, top: number, w: number, h: number, r: number, style: { fill?: ReturnType<typeof rgb>; stroke?: ReturnType<typeof rgb>; lineWidth?: number }) {
  const d = `M${r} 0 H${w - r} Q${w} 0 ${w} ${r} V${h - r} Q${w} ${h} ${w - r} ${h} H${r} Q0 ${h} 0 ${h - r} V${r} Q0 0 ${r} 0 Z`;
  c.page.drawSvgPath(d, { x, y: y(top), color: style.fill, borderColor: style.stroke, borderWidth: style.stroke ? (style.lineWidth ?? 0.8) : 0 });
}

function qr(c: Ctx, value: string, x: number, top: number, size: number, pad = 3) {
  const { modules } = QRCode.create(value, { errorCorrectionLevel: "M" });
  const n = modules.size;
  const cell = (size - pad * 2) / n;
  c.page.drawRectangle({ x, y: y(top) - size, width: size, height: size, color: WHITE });
  for (let r = 0; r < n; r++)
    for (let col = 0; col < n; col++)
      if (modules.data[r * n + col]) c.page.drawRectangle({ x: x + pad + col * cell, y: y(top + pad + r * cell) - cell, width: cell + 0.15, height: cell + 0.15, color: NAVY });
}

const dashed = (c: Ctx, top: number) => c.page.drawLine({ start: { x: 40, y: y(top) }, end: { x: W - 40, y: y(top) }, thickness: 0.7, color: GREY, dashArray: [3, 3] });

function footer(c: Ctx) {
  c.page.drawLine({ start: { x: 40, y: y(768) }, end: { x: W - 40, y: y(768) }, thickness: 0.6, color: GREY });
  const line1 = `${asso.legalName.toUpperCase()} - ${asso.address} - ${asso.postalCode} ${asso.city.toUpperCase()}`;
  const line2 = `SIRET ${asso.siret} - ${asso.form} - RNA ${asso.rna} - Tél : ${asso.phone} - ${asso.website} - ${asso.email}`;
  text(c, line1, W / 2, 778, 7.5, { align: "center", color: BLUE });
  text(c, line2, W / 2, 790, 7.5, { align: "center", color: BLUE });
  text(c, "Coordonnées et numéros fictifs, à remplacer par les informations officielles de l'association.", W / 2, 806, 6.5, { align: "center", color: GREY, font: c.oblique });
}

/** Attestation d'adhésion : une page A4, sur le modèle d'une attestation de licence sportive. */
export async function buildAttestation(m: MemberPublic, verifyUrl: string) {
  const c = await setup(`Attestation d'adhésion ${m.memberNumber}`);
  const logo = await c.doc.embedPng(Buffer.from(LOGO_PNG, "base64"));
  const logoColor = await c.doc.embedPng(Buffer.from(LOGO_COLOR_PNG, "base64"));
  const fullName = `${m.lastName} ${m.firstName}`.toUpperCase();
  const seasonShort = m.season.replace(/\s/g, "");
  const minor = isMinor(m.birthDate, m.joinedAt.slice(0, 10));

  // En-tête
  c.page.drawImage(logo, { x: 40, y: y(112), width: 72, height: 72 });
  text(c, `Attestation d'adhésion Saison ${seasonShort}`, 350, 52, 21, { font: c.bold, align: "center", color: NAVY });
  text(c, "Association de supportrices du Paris Saint-Germain", 350, 84, 10, { align: "center", color: GREY });
  c.page.drawLine({ start: { x: 40, y: y(124) }, end: { x: W - 40, y: y(124) }, thickness: 1, color: NAVY });
  c.page.drawLine({ start: { x: 40, y: y(124) }, end: { x: 120, y: y(124) }, thickness: 2.4, color: RED });

  // Identité
  const rows: Array<[string, string, boolean?]> = [
    ["N° SIRET", asso.siret],
    ["Association", asso.legalName.replace("Association ", "").toUpperCase()],
    ["N° d'adhérent(e)", m.memberNumber, true],
    ["Nom", fullName, true],
    ["Né(e) le", fmtDate(m.birthDate), true],
    ["Statut", minor ? "Adhérent(e) mineur(e), autorisation parentale" : "Adhérent(e)"],
  ];
  let top = 168;
  for (const [label, value, strong] of rows) {
    const w = text(c, `${label} : `, 65, top, 11);
    text(c, value, 65 + w, top, 11, { font: strong ? c.bold : c.reg });
    top += 19;
  }

  // Mini-carte à droite
  const cx = 372;
  const cy = 150;
  roundRect(c, cx, cy, 178, 108, 7, { fill: NAVY, stroke: RED, lineWidth: 1 });
  c.page.drawImage(logoColor, { x: cx + 10, y: y(cy + 44), width: 34, height: 34 });
  text(c, "LES DAMES DU PARC", cx + 52, cy + 14, 7.5, { font: c.bold, color: WHITE });
  text(c, `MEMBRE ${m.season}`, cx + 52, cy + 26, 6.5, { color: rgb(0.7, 0.76, 0.88) });
  text(c, fullName.length > 24 ? fullName.slice(0, 23) + "." : fullName, cx + 10, cy + 68, 8.5, { font: c.bold, color: WHITE });
  text(c, `N° ${m.memberNumber}`, cx + 10, cy + 82, 7, { color: rgb(0.8, 0.84, 0.92) });
  qr(c, verifyUrl, cx + 178 - 52 - 8, cy + 108 - 52 - 8, 52, 2.5);
  text(c, m.memberNumber, cx + 89, cy + 118, 8, { align: "center", color: INK });

  // Corps
  const presenter = `${asso.legalName}, ${asso.form} déclarée sous le numéro ${asso.rna}, dont le siège est situé ${asso.address}, ${asso.postalCode} ${asso.city}, représentée par sa ${asso.presidentTitle} `;
  let next = paragraph(
    c,
    [
      { t: `Nous soussignés, ${presenter}` },
      { t: asso.president, bold: true },
      { t: ", attestons que " },
      { t: `${m.lastName.toUpperCase()} ${m.firstName}`, bold: true },
      { t: ", né(e) le " },
      { t: fmtDate(m.birthDate), bold: true },
      { t: ", est adhérent(e) de l'association depuis le " },
      { t: fmtDate(m.joinedAt), bold: true },
      { t: ` pour la saison ${seasonShort}, valable jusqu'au ` },
      { t: fmtDate(m.validUntil), bold: true },
      { t: "." },
    ],
    40,
    300,
    W - 80,
    11,
    15.5,
  );
  if (minor && m.guardian) {
    next = paragraph(
      c,
      [
        { t: "Adhésion d'un(e) mineur(e) : autorisation parentale délivrée par " },
        { t: `${m.guardian.firstName} ${m.guardian.lastName.toUpperCase()}`, bold: true },
        { t: ` (${guardianRelations[m.guardian.relation].toLowerCase()}), ${m.authorizations.length} document(s) signé(s) conservé(s) au dossier.` },
      ],
      40,
      next + 8,
      W - 80,
      11,
      15.5,
    );
  }
  text(c, "Délivrée pour servir et valoir ce que de droit.", 40, next + 14, 11);
  text(c, `Fait à ${asso.city} le ${fmtDate(new Date().toISOString())}`, 40, next + 44, 11);

  // Signature (tracé vectoriel) et nom de la présidente
  c.page.drawSvgPath("M0 26 C8 -6 16 34 26 8 C30 -2 34 30 44 12 S62 -4 70 18 C78 34 92 2 104 14 L128 8", { x: 400, y: y(400), borderColor: NAVY_2, borderWidth: 1.5 });
  text(c, asso.president, 455, 432, 11, { align: "center", color: INK });
  text(c, asso.presidentTitle, 455, 446, 9.5, { align: "center", color: GREY });

  dashed(c, 500);

  // Bandeau carte
  const bx = 40;
  const bt = 518;
  roundRect(c, bx, bt, 258, 172, 6, { fill: NAVY });
  c.page.drawRectangle({ x: bx, y: y(bt + 172), width: 258, height: 5, color: RED });
  c.page.drawImage(logoColor, { x: bx + 16, y: y(bt + 78), width: 62, height: 62 });
  text(c, "LES DAMES", bx + 90, bt + 26, 15, { font: c.bold, color: WHITE });
  text(c, "DU PARC", bx + 90, bt + 42, 15, { font: c.bold, color: WHITE });
  text(c, "Supportrices du Paris Saint-Germain", bx + 90, bt + 62, 7, { color: rgb(0.7, 0.76, 0.88) });
  text(c, "ADHÉSION", bx + 16, bt + 96, 22, { font: c.bold, color: WHITE });
  text(c, m.season.replace(" / ", "-"), bx + 16, bt + 122, 20, { color: rgb(0.7, 0.76, 0.88) });
  c.page.drawRectangle({ x: bx, y: y(bt + 166), width: 258, height: 22, color: rgb(0, 0, 0) });
  text(c, "CARTE MEMBRE", bx + 16, bt + 149, 10, { font: c.bold, color: WHITE });
  text(c, m.memberNumber, bx + 242, bt + 149, 9, { color: WHITE, align: "right" });

  const rx = 306;
  roundRect(c, rx, bt, 249, 172, 4, { stroke: rgb(0.7, 0.72, 0.78), lineWidth: 0.6 });
  paragraph(
    c,
    [{ t: "Cette carte atteste de l'adhésion de son titulaire à l'association. Elle donne accès aux avantages, événements et offres réservés aux membres. Elle est personnelle et doit être présentée sur demande." }],
    rx + 8,
    bt + 8,
    118,
    5.8,
    7.2,
  );
  roundRect(c, rx + 132, bt + 8, 108, 40, 3, { stroke: rgb(0.7, 0.72, 0.78), lineWidth: 0.6 });
  text(c, "Signature de l'adhérent(e)", rx + 136, bt + 12, 5.8, { color: GREY });
  text(c, m.memberNumber, rx + 8, bt + 78, 8, { font: c.bold });
  text(c, `${m.lastName.toUpperCase()} ${m.firstName}`.slice(0, 30), rx + 8, bt + 90, 8);
  text(c, `${m.address.postalCode} ${m.address.city}`.toUpperCase().slice(0, 30), rx + 8, bt + 102, 8);
  text(c, "Adhésion valide", rx + 8, bt + 124, 8, { font: c.bold, color: rgb(0.05, 0.5, 0.25) });
  text(c, `jusqu'au ${fmtDate(m.validUntil)}`, rx + 8, bt + 135, 7.5, { color: GREY });
  qr(c, verifyUrl, rx + 249 - 66 - 8, bt + 172 - 66 - 8, 66, 3);
  text(c, "Scannez pour vérifier", rx + 249 - 41, bt + 172 - 6, 5.5, { align: "center", color: GREY });
  text(c, `${seasonShort}`, W - 40, bt + 178, 13, { font: c.bold, color: NAVY, align: "right" });
  text(c, "Vérification : " + verifyUrl, 40, bt + 180, 6.5, { color: GREY });

  footer(c);
  return c.doc.save();
}

/** Modèle d'autorisation parentale à imprimer, signer et rejoindre au formulaire d'adhésion. */
export async function buildAuthorizationTemplate() {
  const c = await setup("Autorisation parentale - adhésion");
  const logo = await c.doc.embedPng(Buffer.from(LOGO_PNG, "base64"));
  c.page.drawImage(logo, { x: 40, y: y(112), width: 72, height: 72 });
  text(c, "Autorisation parentale", 350, 52, 22, { font: c.bold, align: "center", color: NAVY });
  text(c, `Adhésion d'un(e) mineur(e) - ${asso.legalName}`, 350, 84, 10, { align: "center", color: GREY });
  c.page.drawLine({ start: { x: 40, y: y(124) }, end: { x: W - 40, y: y(124) }, thickness: 1, color: NAVY });
  c.page.drawLine({ start: { x: 40, y: y(124) }, end: { x: 120, y: y(124) }, thickness: 2.4, color: RED });

  const line = (label: string, top: number, x = 40, w = W - 80) => {
    const lw = text(c, label, x, top, 11);
    c.page.drawLine({ start: { x: x + lw + 6, y: y(top + 12) }, end: { x: x + w, y: y(top + 12) }, thickness: 0.6, color: GREY });
  };

  text(c, "Je soussigné(e)", 40, 160, 11, { font: c.bold });
  line("Nom et prénom :", 186);
  line("Né(e) le :", 214, 40, 250);
  line("Adresse :", 242);
  line("Téléphone :", 270, 40, 250);
  line("E-mail :", 270, 305, 250);
  line("Agissant en qualité de (mère, père, représentant légal) :", 298);

  text(c, "Autorise l'enfant", 40, 340, 11, { font: c.bold });
  line("Nom et prénom :", 366);
  line("Né(e) le :", 394, 40, 250);

  let next = paragraph(
    c,
    [
      { t: `à adhérer à l'association ` },
      { t: asso.name, bold: true },
      { t: ` pour la saison en cours, à participer à ses activités, rencontres et événements, et à recevoir les informations de l'association. Je reconnais avoir pris connaissance des statuts et du règlement intérieur et m'engage à signaler toute modification des informations ci-dessus.` },
    ],
    40,
    432,
    W - 80,
    11,
    15.5,
  );
  next = paragraph(c, [{ t: "Ce document signé (PDF ou scan) est à joindre au formulaire d'adhésion en ligne. Il est conservé au dossier de l'adhérente et consultable uniquement par les administrateurs de l'association." }], 40, next + 10, W - 80, 10, 14);

  line("Fait à :", next + 30, 40, 250);
  line("Le :", next + 30, 305, 250);
  roundRect(c, 320, next + 62, 235, 90, 4, { stroke: rgb(0.7, 0.72, 0.78), lineWidth: 0.7 });
  text(c, "Signature du responsable légal", 330, next + 70, 9, { color: GREY });
  footer(c);
  return c.doc.save();
}
