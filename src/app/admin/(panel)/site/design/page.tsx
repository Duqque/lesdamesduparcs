import { SubmitButton } from "@/components/admin/SubmitButton";
import { Field, Flash, PageHeader, Panel, inp } from "@/components/admin/ui";
import { first, type SP } from "@/lib/admin/params";
import { requireAdmin } from "@/lib/server/admin-auth";
import { siteConfig } from "@/lib/server/content";
import { saveDesignAction } from "../actions";

export const metadata = { title: "Design du site" };

export default async function DesignPage({ searchParams }: { searchParams: Promise<SP> }) {
  await requireAdmin("site.structure");
  const sp = await searchParams;
  const { design } = await siteConfig.get();
  return (
    <>
      <PageHeader title="Design" subtitle="Réservé à la super administratrice : couleur d'accent. La typographie et la mise en page se modifient dans le code du site." />
      <Flash ok={first(sp.ok)} error={first(sp.erreur)} />
      <form action={saveDesignAction} className="grid gap-4">
        <Panel title="Couleur d'accent">
          <Field label="Rouge principal (format #rrggbb)" hint="Par défaut #d90f2c (rouge Paris). Boutons, surtitres et accents.">
            <div className="flex items-center gap-3"><input type="color" name="accent" defaultValue={design.accent} className="h-10 w-14 rounded-[8px] border border-white/20 bg-transparent" /><span className="font-body text-[13px] text-mist">{design.accent}</span></div>
          </Field>
        </Panel>
        <Panel title="Notes de design"><Field label="Note interne"><input name="note" defaultValue={design.note} className={inp} /></Field></Panel>
        <div><SubmitButton>Enregistrer</SubmitButton></div>
      </form>
    </>
  );
}
