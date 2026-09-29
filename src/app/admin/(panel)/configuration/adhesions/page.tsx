import { SubmitButton } from "@/components/admin/SubmitButton";
import { Badge, Field, Flash, PageHeader, Panel, inp } from "@/components/admin/ui";
import { fmtDate, num } from "@/lib/admin/format";
import { first, type SP } from "@/lib/admin/params";
import { requireAdmin } from "@/lib/server/admin-auth";
import { settings } from "@/lib/server/admin-store";
import { adhesionCapStatus } from "@/lib/server/business";
import { activateAdhesionCampaignAction, saveSettingsAction, stopAdhesionCampaignAction } from "../actions";

export const metadata = { title: "Configuration · Adhésions" };

export default async function AdhesionSettingsPage({ searchParams }: { searchParams: Promise<SP> }) {
  await requireAdmin("settings.edit");
  const sp = await searchParams;
  const [{ adhesions: a }, status] = await Promise.all([settings.get(), adhesionCapStatus()]);
  const c = a.campaign;
  return (
    <>
      <PageHeader title="Adhésions" subtitle="Durée (du 1er juillet au 30 juin), renouvellement et règles générales. Les formules et leurs prix se gèrent dans Adhérentes > Formules d'adhésion." />
      <Flash ok={first(sp.ok)} error={first(sp.erreur)} />
      <Panel>
        <form action={saveSettingsAction.bind(null, "adhesions")} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Rappels de renouvellement (jours avant l'échéance, séparés par des virgules)" className="sm:col-span-2"><input name="reminders" defaultValue={a.renewalReminderDays.join(", ")} className={inp} /></Field>
          <label className="flex items-center gap-2 font-body text-[13.5px] text-white/85"><input type="checkbox" name="autoRenew" defaultChecked={a.autoRenew} className="size-4 accent-[#d90f2c]" /> Renouvellement automatique par défaut</label>
          <label className="flex items-center gap-2 font-body text-[13.5px] text-white/85"><input type="checkbox" name="openToAll" defaultChecked={a.openToAll} className="size-4 accent-[#d90f2c]" /> Adhésion ouverte à toutes les supportrices</label>
          <div className="sm:col-span-2"><SubmitButton>Enregistrer</SubmitButton></div>
        </form>
      </Panel>

      <Panel className="mt-4" title="Campagne d'adhésion">
        <p className="font-body text-[13.5px] leading-[1.7] text-mist">
          Sans campagne active, le bouton « Devenir membre » disparaît du site (remplacé par un message) et toute nouvelle inscription ou tout nouveau paiement est refusé côté serveur — les renouvellements des adhérentes déjà passées par une adhésion réglée ne sont jamais concernés.
          Activer une campagne envoie aussi, une seule fois, un mail de relance aux comptes déjà créés mais sans adhésion active.
        </p>

        {c ? (
          <div className="mt-5 rounded-[12px] border border-white/10 bg-[#0b1327]/90 p-5">
            <p className="flex flex-wrap items-center gap-2 font-body text-[14.5px] text-white">
              <Badge tone="green">Active</Badge> « {c.label} », depuis le {fmtDate(c.startedAt)}
            </p>
            <p className="mt-2 font-body text-[13.5px] text-mist">
              {c.limit === null ? "Places illimitées." : `${num(status.remaining ?? 0)} place${(status.remaining ?? 0) > 1 ? "s" : ""} restante${(status.remaining ?? 0) > 1 ? "s" : ""} sur ${num(c.limit)}.`}
              {" "}{c.emailedAt ? `Mail de relance envoyé le ${fmtDate(c.emailedAt)}.` : "Mail de relance non envoyé (aucun compte concerné)."}
            </p>
            <form action={stopAdhesionCampaignAction} className="mt-4">
              <SubmitButton variant="danger" confirm={`Arrêter la campagne « ${c.label} » ? Les nouvelles adhésions seront refermées immédiatement (les renouvellements restent possibles).`}>Arrêter la campagne</SubmitButton>
            </form>
          </div>
        ) : (
          <p className="mt-5 font-body text-[13.5px] text-amber-100">Aucune campagne active : les nouvelles adhésions sont fermées.</p>
        )}

        {a.pastCampaigns.length > 0 && (
          <details className="mt-4">
            <summary className="cursor-pointer font-body text-[12.5px] text-mist">Campagnes précédentes ({a.pastCampaigns.length})</summary>
            <ul className="mt-2 space-y-1 font-body text-[12.5px] text-mist">
              {a.pastCampaigns.slice().reverse().map((p, i) => (
                <li key={i}>« {p.label} » — {fmtDate(p.startedAt)} → {p.stoppedAt ? fmtDate(p.stoppedAt) : "?"} ({p.limit === null ? "illimitée" : `${num(p.limit)} places`})</li>
              ))}
            </ul>
          </details>
        )}

        <form action={activateAdhesionCampaignAction} className="mt-6 grid grid-cols-1 gap-4 border-t border-white/10 pt-5 sm:grid-cols-2">
          <Field label="Nom de la campagne" className="sm:col-span-2"><input name="label" defaultValue="Campagne d'adhésion" className={inp} /></Field>
          <Field label="Nombre de places"><input name="limit" type="number" min={1} defaultValue={200} className={inp} /></Field>
          <label className="flex items-center gap-2 self-end pb-2.5 font-body text-[13.5px] text-white/85"><input type="checkbox" name="unlimited" className="size-4 accent-[#d90f2c]" /> Places illimitées</label>
          <div className="sm:col-span-2"><SubmitButton confirm={c ? `Remplacer la campagne « ${c.label} » en cours par une nouvelle ?` : undefined}>{c ? "Réactiver une nouvelle campagne" : "Activer la campagne"}</SubmitButton></div>
        </form>
      </Panel>
    </>
  );
}
