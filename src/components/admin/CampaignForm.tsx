import { saveCampaignAction } from "@/app/admin/(panel)/communication/actions";
import type { Campaign } from "@/lib/server/content";
import { SubmitButton } from "./SubmitButton";
import { Field, Panel, area, inp } from "./ui";

const toLocal = (iso?: string) => (iso ? new Date(iso).toISOString().slice(0, 16) : "");

export function CampaignForm({ campaign, segments }: { campaign?: Campaign; segments: Array<{ key: string; label: string }> }) {
  const locked = campaign?.status === "sent";
  return (
    <form action={saveCampaignAction} className="grid gap-4">
      {campaign && <input type="hidden" name="id" value={campaign.id} />}
      <Panel title="Destinataires">
        <div className="grid gap-2.5 sm:grid-cols-2">
          {segments.map((s) => (
            <label key={s.key} className="flex items-center gap-2.5 font-body text-[13.5px] text-white/85">
              <input type="checkbox" name="audience" value={s.key} defaultChecked={campaign?.audience.includes(s.key)} disabled={locked} className="size-4 accent-[#d90f2c]" />
              {s.label}
            </label>
          ))}
        </div>
      </Panel>
      <Panel title="Message">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Objet" className="sm:col-span-2"><input name="subject" defaultValue={campaign?.subject} required disabled={locked} className={inp} /></Field>
          <Field label="Contenu" hint="Utilisez {{prenom}} pour personnaliser." className="sm:col-span-2"><textarea name="body" rows={10} defaultValue={campaign?.body} required disabled={locked} className={area} /></Field>
          <Field label="Texte du bouton"><input name="buttonLabel" defaultValue={campaign?.buttonLabel} disabled={locked} className={inp} /></Field>
          <Field label="Lien du bouton"><input name="buttonUrl" defaultValue={campaign?.buttonUrl} disabled={locked} className={inp} /></Field>
          <Field label="Programmer l'envoi (facultatif)"><input type="datetime-local" name="scheduledAt" defaultValue={toLocal(campaign?.scheduledAt)} disabled={locked} className={inp} /></Field>
        </div>
      </Panel>
      {!locked && <div><SubmitButton>{campaign ? "Enregistrer" : "Créer la campagne"}</SubmitButton></div>}
    </form>
  );
}
