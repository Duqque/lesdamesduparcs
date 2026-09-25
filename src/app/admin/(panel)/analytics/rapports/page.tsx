import { Download } from "lucide-react";
import { SubmitButton } from "@/components/admin/SubmitButton";
import { PageHeader, Panel, btn, inp, lbl } from "@/components/admin/ui";
import { first, type SP } from "@/lib/admin/params";
import { requireAdmin } from "@/lib/server/admin-auth";
import { REPORT_SECTIONS, buildReport } from "@/lib/server/reports";

export const metadata = { title: "Rapports" };

export default async function ReportsPage({ searchParams }: { searchParams: Promise<SP> }) {
  const ctx = await requireAdmin("reports.generate");
  const sp = await searchParams;
  const month = first(sp.mois) ?? new Date().toISOString().slice(0, 7);
  const chosen = Array.isArray(sp.s) ? sp.s : sp.s ? [sp.s] : [];
  const generated = first(sp.generer) === "1";
  const report = generated ? await buildReport(month, chosen, ctx.can("finance.view")) : null;
  const qs = new URLSearchParams({ mois: month, ...Object.fromEntries([]) });
  chosen.forEach((s) => qs.append("s", s));
  return (
    <>
      <PageHeader title="Rapports" subtitle="Un récapitulatif exploitable, mois par mois, avec les sections de votre choix." />
      <Panel title="Générer un rapport" className="mb-4">
        <form method="get" className="grid gap-4">
          <input type="hidden" name="generer" value="1" />
          <label className="max-w-[240px]"><span className={lbl}>Période (mois)</span><input type="month" name="mois" defaultValue={month} className={inp + " mt-1.5"} /></label>
          <fieldset className="flex flex-wrap gap-5">
            <legend className={lbl + " mb-2"}>Inclure</legend>
            {REPORT_SECTIONS.filter(([k]) => k !== "finances" || ctx.can("finance.view")).map(([k, l]) => (
              <label key={k} className="flex items-center gap-2 font-body text-[13.5px] text-white/85"><input type="checkbox" name="s" value={k} defaultChecked={!generated || chosen.includes(k)} className="size-4 accent-[#d90f2c]" />{l}</label>
            ))}
          </fieldset>
          <div><SubmitButton>Générer le rapport</SubmitButton></div>
        </form>
      </Panel>
      {report && (
        <Panel title={report.title} action={<a href={`/admin/export/rapport?${qs.toString()}`} className={btn.small}><Download aria-hidden className="size-3.5" /> PDF</a>}>
          <div className="space-y-8">
            {report.sections.map((sec) => (
              <section key={sec.title}>
                <h3 className="border-b border-psg-red/60 pb-2 font-body text-[13px] font-semibold uppercase tracking-[0.14em] text-white">{sec.title}</h3>
                <dl className="mt-3 divide-y divide-white/[0.06]">
                  {sec.rows.map(([k, v]) => <div key={k} className="flex justify-between gap-6 py-2 font-body text-[14px]"><dt className="text-white/80">{k}</dt><dd className="tabular-nums text-white">{v}</dd></div>)}
                </dl>
              </section>
            ))}
            {report.sections.length === 0 && <p className="font-body text-mist">Aucune section sélectionnée.</p>}
          </div>
        </Panel>
      )}
    </>
  );
}
