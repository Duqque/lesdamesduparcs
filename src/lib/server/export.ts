import "server-only";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export interface Col<T> {
  label: string;
  value: (row: T) => string | number | null | undefined;
  /** largeur relative dans le PDF */
  w?: number;
}

const esc = (v: string | number | null | undefined) => {
  const s = v === null || v === undefined ? "" : String(v);
  return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/** CSV avec point-virgule et BOM UTF-8 : s'ouvre directement dans Excel en français. */
export function toCsv<T>(rows: T[], cols: Col<T>[]) {
  const lines = [cols.map((c) => esc(c.label)).join(";"), ...rows.map((r) => cols.map((c) => esc(c.value(r))).join(";"))];
  return "﻿" + lines.join("\r\n");
}

export function csvResponse(name: string, body: string) {
  return new Response(body, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="${name}.csv"`, "Cache-Control": "no-store" } });
}

const safe = (s: string, font: { getCharacterSet(): number[] }) => {
  const set = new Set(font.getCharacterSet());
  return [...s.replace(/[’‘]/g, "'").replace(/[“”]/g, '"').replace(/[‐-―]/g, "-").replace(/[  ]/g, " ")].map((c) => (set.has(c.codePointAt(0)!) ? c : "?")).join("");
};

/** Tableau PDF (A4 paysage, plusieurs pages si besoin). */
export async function toPdf<T>(title: string, subtitle: string, rows: T[], cols: Col<T>[]) {
  const doc = await PDFDocument.create();
  doc.setTitle(title);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const W = 841.89;
  const H = 595.28;
  const M = 30;
  const total = cols.reduce((n, c) => n + (c.w ?? 1), 0);
  const widths = cols.map((c) => ((W - 2 * M) * (c.w ?? 1)) / total);
  let page = doc.addPage([W, H]);
  let y = H - M;
  const header = () => {
    page.drawText(safe(title, bold), { x: M, y: y - 14, size: 15, font: bold, color: rgb(0.02, 0.07, 0.15) });
    page.drawText(safe(subtitle, font), { x: M, y: y - 30, size: 8.5, font, color: rgb(0.4, 0.44, 0.5) });
    y -= 46;
    page.drawRectangle({ x: M, y: y - 4, width: W - 2 * M, height: 18, color: rgb(0.02, 0.07, 0.15) });
    let x = M + 4;
    cols.forEach((c, i) => {
      page.drawText(safe(c.label, bold), { x, y: y, size: 7.5, font: bold, color: rgb(1, 1, 1) });
      x += widths[i];
    });
    y -= 20;
  };
  header();
  rows.forEach((r, n) => {
    if (y < M + 14) {
      page = doc.addPage([W, H]);
      y = H - M;
      header();
    }
    if (n % 2 === 0) page.drawRectangle({ x: M, y: y - 3.5, width: W - 2 * M, height: 13, color: rgb(0.95, 0.96, 0.98) });
    let x = M + 4;
    cols.forEach((c, i) => {
      let s = safe(String(c.value(r) ?? ""), font);
      const max = widths[i] - 8;
      while (s.length > 1 && font.widthOfTextAtSize(s, 7.5) > max) s = s.slice(0, -2) + "…";
      page.drawText(s.replace("…", "."), { x, y, size: 7.5, font, color: rgb(0.1, 0.12, 0.16) });
      x += widths[i];
    });
    y -= 13;
  });
  if (rows.length === 0) page.drawText("Aucun résultat.", { x: M, y: y - 10, size: 9, font, color: rgb(0.4, 0.44, 0.5) });
  return doc.save();
}

export function pdfResponse(name: string, bytes: Uint8Array) {
  return new Response(Buffer.from(bytes), { headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="${name}.pdf"`, "Cache-Control": "no-store" } });
}
