import { SubmitButton } from "@/components/admin/SubmitButton";
import { Field, Flash, PageHeader, Panel, inp } from "@/components/admin/ui";
import { first, type SP } from "@/lib/admin/params";
import { requireAdmin } from "@/lib/server/admin-auth";
import { settings } from "@/lib/server/admin-store";
import { saveSettingsAction } from "../actions";

export const metadata = { title: "Configuration · Adhésions" };

export default async function AdhesionSettingsPage({ searchParams }: { searchParams: Promise<SP> }) {
  await requireAdmin("settings.edit");
  const sp = await searchParams;
  const { adhesions: a } = await settings.get();
  return (
    <>
      <PageHeader title="Adhésions" subtitle="Durée, renouvellement et règles générales. Les formules et leurs prix se gèrent dans Adhérentes > Formules d'adhésion." />
      <Flash ok={first(sp.ok)} error={first(sp.erreur)} />
      <Panel>
        <form action={saveSettingsAction.bind(null, "adhesions")} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Mois de début de saison (1 à 12)" hint="9 = septembre : la saison court du 1er septembre au 31 août."><input name="startMonth" type="number" min={1} max={12} defaultValue={a.seasonStartMonth} className={inp} /></Field>
          <Field label="Rappels de renouvellement (jours avant l'échéance, séparés par des virgules)"><input name="reminders" defaultValue={a.renewalReminderDays.join(", ")} className={inp} /></Field>
          <label className="flex items-center gap-2 font-body text-[13.5px] text-white/85"><input type="checkbox" name="autoRenew" defaultChecked={a.autoRenew} className="size-4 accent-[#d90f2c]" /> Renouvellement automatique par défaut</label>
          <label className="flex items-center gap-2 font-body text-[13.5px] text-white/85"><input type="checkbox" name="openToAll" defaultChecked={a.openToAll} className="size-4 accent-[#d90f2c]" /> Adhésion ouverte à toutes les supportrices</label>
          <div className="sm:col-span-2"><SubmitButton>Enregistrer</SubmitButton></div>
        </form>
      </Panel>
    </>
  );
}
