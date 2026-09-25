import { NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { audit, getAdmin } from "@/lib/server/admin-auth";
import { buildReport } from "@/lib/server/reports";

const safe = (s: string) => s.replace(/[’‘]/g, "'").replace(/[‐-―]/g, "-").replace(/[  ]/g, " ").replace(/[^\x20-\x7e -ÿ]/g, "?");

/** Rapport mensuel en PDF (A4). */
export async function GET(req: Request) {
  const admin = await getAdmin();
  if (!admin) return NextResponse.redirect(new URL("/admin/connexion", req.url));
  if (!admin.can("reports.generate")) return new Response("Accès refusé.", { status: 403 });
  const url = new URL(req.url);
  const month = /^\d{4}-\d{2}$/.test(url.searchParams.get("mois") ?? "") ? url.searchParams.get("mois")! : new Date().toISOString().slice(0, 7);
  const report = await buildReport(month, url.searchParams.getAll("s"), admin.can("finance.view"));
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  let page = doc.addPage([595.28, 841.89]);
  let y = 800;
  page.drawText("LES DAMES DU PARC", { x: 40, y, size: 9, font: bold, color: rgb(0.85, 0.06, 0.17) });
  y -= 26;
  page.drawText(safe(report.title), { x: 40, y, size: 20, font: bold, color: rgb(0.02, 0.07, 0.15) });
  y -= 14;
  page.drawText(safe(`Généré le ${new Date().toLocaleDateString("fr-FR")} par ${admin.admin.firstName} ${admin.admin.lastName}`), { x: 40, y, size: 8.5, font, color: rgb(0.4, 0.44, 0.5) });
  y -= 30;
  for (const sec of report.sections) {
    if (y < 120) { page = doc.addPage([595.28, 841.89]); y = 800; }
    page.drawText(safe(sec.title.toUpperCase()), { x: 40, y, size: 10.5, font: bold, color: rgb(0.02, 0.07, 0.15) });
    page.drawLine({ start: { x: 40, y: y - 5 }, end: { x: 555, y: y - 5 }, thickness: 1.2, color: rgb(0.85, 0.06, 0.17) });
    y -= 22;
    for (const [k, v] of sec.rows) {
      if (y < 60) { page = doc.addPage([595.28, 841.89]); y = 800; }
      page.drawText(safe(k), { x: 40, y, size: 10, font, color: rgb(0.1, 0.12, 0.16) });
      page.drawText(safe(v), { x: 555 - font.widthOfTextAtSize(safe(v), 10), y, size: 10, font: bold, color: rgb(0.1, 0.12, 0.16) });
      y -= 16;
    }
    y -= 14;
  }
  await audit(admin, "rapport", "rapport", `${report.title} généré (PDF)`);
  return new Response(Buffer.from(await doc.save()), { headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="rapport-${month}.pdf"`, "Cache-Control": "no-store" } });
}
