import Link from "next/link";
import { SubmitButton } from "@/components/admin/SubmitButton";
import { Field, Flash, PageHeader, Panel, area, inp } from "@/components/admin/ui";
import { first, type SP } from "@/lib/admin/params";
import { CMS_FIELDS, CMS_PAGES } from "@/data/cms-fields";
import { requireAdmin } from "@/lib/server/admin-auth";
import { siteConfig } from "@/lib/server/content";
import { cn } from "@/lib/cn";
import { saveCmsAction } from "../actions";

export const metadata = { title: "Contenus des pages" };

export default async function CmsPage({ searchParams }: { searchParams: Promise<SP> }) {
  await requireAdmin("site.content");
  const sp = await searchParams;
  const page = CMS_PAGES.find((p) => p.path === first(sp.page))?.path ?? CMS_PAGES[0].path;
  const { cms } = await siteConfig.get();
  const fields = CMS_FIELDS.filter((f) => f.page === page);
  return (
    <>
      <PageHeader title="Contenus des pages" subtitle="Modifiez les textes des pages. Laissez un champ tel quel (ou vide) pour garder le texte d'origine. Les photos et vidéos se modifient là où elles vivent : Accueil, Photos du groupe, Produits, Articles, Événements, Pages d'erreur, et la Médiathèque pour tout envoyer." />
      <Flash ok={first(sp.ok)} error={first(sp.erreur)} />
      <nav aria-label="Pages" className="mb-4 flex flex-wrap gap-2">
        {CMS_PAGES.map((p) => <Link key={p.path} href={`/admin/site/contenus?page=${encodeURIComponent(p.path)}`} className={cn("inline-flex min-h-11 items-center rounded-full border px-4 font-body text-[13.5px]", p.path === page ? "border-psg-red-bright bg-psg-red/15 text-white" : "border-white/15 text-white/75 hover:border-white/40")}>{p.label}</Link>)}
      </nav>
      <Panel title={CMS_PAGES.find((p) => p.path === page)?.label}>
        <form action={saveCmsAction.bind(null, page)} className="grid gap-5">
          {fields.map((f) => (
            <Field key={f.key} label={f.label} hint={f.default ? `Texte d'origine : ${f.default.replace(/\n/g, " / ")}` : "Vide : texte d'origine du site."}>
              {f.type === "textarea" ? <textarea name={f.key} rows={3} defaultValue={cms?.[f.key] ?? ""} placeholder={f.default} className={area} /> : <input name={f.key} defaultValue={cms?.[f.key] ?? ""} placeholder={f.default} className={inp} />}
            </Field>
          ))}
          <div><SubmitButton>Enregistrer les textes</SubmitButton></div>
        </form>
      </Panel>
    </>
  );
}
