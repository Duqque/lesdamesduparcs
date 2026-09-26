import { Badge, Field, Flash, PageHeader, Panel, area, inp } from "@/components/admin/ui";
import { SubmitButton } from "@/components/admin/SubmitButton";
import { first, type SP } from "@/lib/admin/params";
import { requireAdmin } from "@/lib/server/admin-auth";
import { settings } from "@/lib/server/admin-store";
import { emailConfigured } from "@/lib/server/email";
import { saveSettingsAction } from "../actions";

export const metadata = { title: "Configuration · E-mails" };

export default async function EmailSettingsPage({ searchParams }: { searchParams: Promise<SP> }) {
  await requireAdmin("settings.edit");
  const sp = await searchParams;
  const { emails: e } = await settings.get();
  return (
    <>
      <PageHeader title="E-mails" subtitle="Adresse d'envoi et signature des messages du système. Les modèles se modifient dans Communication > Modèles." />
      <Flash ok={first(sp.ok)} error={first(sp.erreur)} />
      <Panel title="Service d'envoi" className="mb-4">
        <p className="flex items-center gap-3 font-body text-[14px] text-white/85">Resend : {emailConfigured() ? <Badge tone="green">Configuré</Badge> : <Badge tone="orange">Non configuré</Badge>}</p>
        <p className="mt-2 font-body text-[12.5px] text-mist">Renseignez <code>RESEND_API_KEY</code> dans les variables d&rsquo;environnement de l&rsquo;hébergement, et faites valider le domaine de l&rsquo;adresse d&rsquo;expédition chez le prestataire. Sans cela, aucun e-mail ne part.</p>
      </Panel>
      <Panel>
        <form action={saveSettingsAction.bind(null, "emails")} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Nom d'expéditeur"><input name="fromName" defaultValue={e.fromName} className={inp} /></Field>
          <Field label="Adresse d'expédition"><input name="fromEmail" type="email" defaultValue={e.fromEmail} className={inp} /></Field>
          <Field label="Signature" className="sm:col-span-2"><textarea name="signature" rows={3} defaultValue={e.signature} className={area} /></Field>
          <div className="sm:col-span-2"><SubmitButton>Enregistrer</SubmitButton></div>
        </form>
      </Panel>
    </>
  );
}
