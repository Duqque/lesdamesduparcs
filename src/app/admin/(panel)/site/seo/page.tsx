import { SubmitButton } from "@/components/admin/SubmitButton";
import { Field, Flash, PageHeader, Panel, area, inp } from "@/components/admin/ui";
import { SITE_PAGES } from "@/lib/admin/site-pages";
import { first, type SP } from "@/lib/admin/params";
import { requireAdmin } from "@/lib/server/admin-auth";
import { settings } from "@/lib/server/admin-store";
import { siteConfig } from "@/lib/server/content";
import { saveSeoAction } from "../actions";

export const metadata = { title: "Paramètres SEO" };

export default async function SeoPage({ searchParams }: { searchParams: Promise<SP> }) {
  await requireAdmin("site.structure");
  const sp = await searchParams;
  const [{ seo }, { site }] = await Promise.all([siteConfig.get(), settings.get()]);
  return (
    <>
      <PageHeader title="Paramètres SEO" subtitle="Réservé à la super administratrice : titre et description affichés dans les moteurs de recherche et lors des partages." />
      <Flash ok={first(sp.ok)} error={first(sp.erreur)} />
      <form action={saveSeoAction} className="grid gap-4">
        <Panel title="Site">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Titre du site"><input name="siteTitle" defaultValue={site.title} className={inp} /></Field>
            <Field label="Favicon (adresse)"><input name="favicon" defaultValue={site.favicon} className={inp} /></Field>
            <Field label="Description par défaut" className="sm:col-span-2"><textarea name="siteDescription" rows={2} defaultValue={site.description} className={area} /></Field>
          </div>
        </Panel>
        {SITE_PAGES.filter((p) => p.path !== "/").map((p) => (
          <Panel key={p.path} title={`${p.label} · ${p.path}`}>
            <div className="grid gap-4">
              <Field label="Titre"><input name={`title:${p.path}`} defaultValue={seo[p.path]?.title} className={inp} /></Field>
              <Field label="Description"><textarea name={`description:${p.path}`} rows={2} defaultValue={seo[p.path]?.description} className={area} /></Field>
            </div>
          </Panel>
        ))}
        <div><SubmitButton>Enregistrer</SubmitButton></div>
      </form>
    </>
  );
}
