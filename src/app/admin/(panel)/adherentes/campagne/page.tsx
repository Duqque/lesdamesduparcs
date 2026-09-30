import { SubmitButton } from "@/components/admin/SubmitButton";
import { Badge, Field, Flash, PageHeader, Panel, inp } from "@/components/admin/ui";
import { num } from "@/lib/admin/format";
import { first, type SP } from "@/lib/admin/params";
import { requireAdmin } from "@/lib/server/admin-auth";
import { settings } from "@/lib/server/admin-store";
import { adhesionCapStatus } from "@/lib/server/business";
import { saveAdhesionCampaignAction, sendReengagementEmailAction } from "./actions";

export const metadata = { title: "Campagne d'adhésions" };

export default async function AdhesionCampaignPage({ searchParams }: { searchParams: Promise<SP> }) {
  await requireAdmin("settings.edit");
  const sp = await searchParams;
  const [{ adhesions: a }, status] = await Promise.all([settings.get(), adhesionCapStatus()]);
  return (
    <>
      <PageHeader title="Campagne d'adhésions" subtitle="Ouvrir, limiter ou mettre en pause les nouvelles adhésions. Ne concerne jamais les renouvellements des adhérentes déjà passées par une adhésion réglée." />
      <Flash ok={first(sp.ok)} error={first(sp.erreur)} />

      <Panel>
        <p className="flex flex-wrap items-center gap-2 font-body text-[14.5px] text-white">
          {a.paused ? <Badge tone="grey">En pause</Badge> : status.blocked ? <Badge tone="red">Complet</Badge> : <Badge tone="green">Ouvertes</Badge>}
          {num(status.count)} / {num(a.limit)} adhésion{a.limit > 1 ? "s" : ""} {a.paused ? "(pause manuelle)" : status.blocked ? "— plafond atteint" : `— ${num(status.remaining)} place${status.remaining > 1 ? "s" : ""} restante${status.remaining > 1 ? "s" : ""}`}
        </p>

        <form action={saveAdhesionCampaignAction} className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="flex items-center gap-2 font-body text-[13.5px] text-white/85 sm:col-span-2">
            <input type="checkbox" name="paused" defaultChecked={a.paused} className="size-4 accent-[#d90f2c]" /> Mettre les adhésions en pause (bloque tout, quel que soit le nombre)
          </label>
          <Field label="Nombre maximum d'adhésions" hint="Dès que ce nombre est atteint, les nouvelles adhésions sont bloquées automatiquement (le bouton « Devenir membre » disparaît). Augmenter ce nombre rouvre aussitôt les adhésions.">
            <input name="limit" type="number" min={1} defaultValue={a.limit} className={inp} />
          </Field>
          <div className="flex items-end sm:col-span-2"><SubmitButton>Enregistrer</SubmitButton></div>
        </form>
      </Panel>

      <Panel className="mt-4" title="Relancer les comptes sans adhésion active">
        <p className="font-body text-[13.5px] leading-[1.7] text-mist">Envoie un mail (une fois, à la demande) à tous les comptes déjà créés mais dont l&rsquo;adhésion n&rsquo;est pas active — invitation à finaliser leur adhésion maintenant que les places sont ouvertes.</p>
        <form action={sendReengagementEmailAction} className="mt-4">
          <SubmitButton variant="outline" confirm="Envoyer le mail de relance à tous les comptes sans adhésion active ?">Envoyer le mail de relance</SubmitButton>
        </form>
      </Panel>
    </>
  );
}
