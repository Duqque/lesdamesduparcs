import { SubmitButton } from "@/components/admin/SubmitButton";
import { Flash, PageHeader, Panel } from "@/components/admin/ui";
import { first, type SP } from "@/lib/admin/params";
import { requireAdmin } from "@/lib/server/admin-auth";
import { settings } from "@/lib/server/admin-store";
import { emailConfigured } from "@/lib/server/email";
import { saveAutomationsAction } from "../actions";

export const metadata = { title: "Automatisations" };

const RULES = [
  ["welcome", "Compte créé", "E-mail de confirmation de création du compte (paiement à finaliser)"],
  ["membershipWelcome", "Adhésion validée", "E-mail de bienvenue avec le lien du Discord privé"],
  ["paymentConfirmation", "Paiement reçu", "E-mail de confirmation"],
  ["paymentFailedReminder", "Paiement échoué", "Relance (bouton « Relancer » dans les finances)"],
  ["renewalJ30", "Adhésion bientôt expirée", "Rappel à J-30"],
  ["renewalJ7", "Adhésion bientôt expirée", "Rappel à J-7"],
  ["eventConfirmation", "Inscription à un événement", "E-mail de confirmation"],
  ["eventReminderJ7", "Événement", "Rappel à J-7"],
  ["eventReminderJ1", "Événement", "Rappel à J-1"],
  ["waitlistNotify", "Liste d'attente", "Notification quand une place se libère"],
  ["paymentReminderJ7", "Adhésion non réglée ou non validée", "Rappel 7 jours après la création du compte"],
  ["paymentReminderJ15", "Adhésion non réglée ou non validée", "Rappel 15 jours après la création du compte"],
  ["notifyArticle", "Nouvel article publié", "E-mail à toutes les adhérentes actives"],
  ["notifyEvent", "Nouvel événement publié", "E-mail à toutes les adhérentes actives"],
  ["notifyProduct", "Nouveau produit en boutique", "E-mail à toutes les adhérentes actives"],
] as const;

export default async function AutomationsPage({ searchParams }: { searchParams: Promise<SP> }) {
  const ctx = await requireAdmin("communication.send");
  const sp = await searchParams;
  const conf = (await settings.get()).automations;
  const editable = ctx.can("settings.edit");
  return (
    <>
      <PageHeader title="Automatisations" subtitle="Le système envoie automatiquement ces messages quand l'événement correspondant se produit. Les rappels planifiés sont traités toutes les dix minutes lorsque l'administration est ouverte, ou par un appel régulier à /api/cron/tick." />
      {!emailConfigured() && <p className="mb-6 rounded-[10px] border border-amber-400/30 bg-amber-400/10 px-4 py-3 font-body text-[13.5px] text-amber-100">Aucun service d&rsquo;e-mail n&rsquo;est configuré : les messages sont préparés et consignés au journal mais ne partent pas.</p>}
      <Flash ok={first(sp.ok)} error={first(sp.erreur)} />
      <form action={saveAutomationsAction}>
        <Panel>
          <ul className="divide-y divide-white/[0.06]">
            {RULES.map(([k, when, then]) => (
              <li key={k} className="flex items-center justify-between gap-4 py-3.5">
                <span className="font-body text-[14px] text-white"><span className="text-mist">{when}</span> → {then}</span>
                <input type="checkbox" name={k} defaultChecked={conf[k]} disabled={!editable} aria-label={`${when} : ${then}`} className="size-5 accent-[#d90f2c]" />
              </li>
            ))}
          </ul>
          {editable && <div className="mt-5"><SubmitButton>Enregistrer</SubmitButton></div>}
        </Panel>
      </form>
    </>
  );
}
