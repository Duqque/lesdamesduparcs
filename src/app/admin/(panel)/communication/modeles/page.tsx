import { SubmitButton } from "@/components/admin/SubmitButton";
import { Field, Flash, PageHeader, Panel, area, inp } from "@/components/admin/ui";
import { first, type SP } from "@/lib/admin/params";
import { requireAdmin } from "@/lib/server/admin-auth";
import { ensureTemplates, templates } from "@/lib/server/content";
import { saveTemplateAction } from "../actions";

export const metadata = { title: "Modèles d'e-mails" };

export default async function TemplatesPage({ searchParams }: { searchParams: Promise<SP> }) {
  await requireAdmin("communication.send");
  const sp = await searchParams;
  await ensureTemplates();
  const list = await templates.all();
  return (
    <>
      <PageHeader title="Modèles" subtitle="Les messages envoyés automatiquement. Variables disponibles : {{prenom}}, {{numero}}, {{saison}}, {{montant}}, {{objet}}, {{date}}, {{fin}}, {{suivi}}, {{consignes}}. Mise en forme : **gras**, « # » titre d’accroche, « ## » intertitre, « • » puces, « > » mention discrète, [libellé](adresse) bouton." />
      <Flash ok={first(sp.ok)} error={first(sp.erreur)} />
      <div className="space-y-4">
        {list.map((t) => (
          <Panel key={t.id} title={t.name}>
            <details>
              <summary className="cursor-pointer font-body text-[13.5px] text-white/80 hover:text-white">{t.subject}</summary>
              <form action={saveTemplateAction} className="mt-4 grid gap-4">
                <input type="hidden" name="id" value={t.id} />
                <Field label="Objet"><input name="subject" defaultValue={t.subject} className={inp} /></Field>
                <Field label="Contenu"><textarea name="body" rows={7} defaultValue={t.body} className={area} /></Field>
                <div><SubmitButton>Enregistrer</SubmitButton></div>
              </form>
            </details>
          </Panel>
        ))}
      </div>
    </>
  );
}
