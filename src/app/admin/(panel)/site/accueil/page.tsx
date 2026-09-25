import Link from "next/link";
import { SubmitButton } from "@/components/admin/SubmitButton";
import { Field, Flash, PageHeader, Panel, area, inp } from "@/components/admin/ui";
import { first, type SP } from "@/lib/admin/params";
import { requireAdmin } from "@/lib/server/admin-auth";
import { articlesDb, siteConfig } from "@/lib/server/content";
import { getPublishedEvents } from "@/lib/server/events";
import { saveHomeContentAction } from "../actions";

export const metadata = { title: "Accueil du site" };

export default async function HomeEditorPage({ searchParams }: { searchParams: Promise<SP> }) {
  const ctx = await requireAdmin("site.content");
  const sp = await searchParams;
  const [{ home }, events, articles] = await Promise.all([siteConfig.get(), getPublishedEvents(), articlesDb.all()]);
  const today = new Date().toISOString().slice(0, 10);
  return (
    <>
      <PageHeader title="Accueil" subtitle="Textes de l'accueil et éléments mis en avant. L'ordre et la visibilité des rubriques se règlent dans « Sections » (super administratrice)." actions={<Link href="/" className="font-body text-[13px] text-mist underline underline-offset-4 hover:text-white">Voir la page</Link>} />
      <Flash ok={first(sp.ok)} error={first(sp.erreur)} />
      <form action={saveHomeContentAction} className="grid gap-4">
        <Panel title="En-tête (hero)">
          <div className="grid gap-4">
            <Field label="Titre" hint="Vide = « Les Dames du Parc »"><input name="heroTitle" defaultValue={home.heroTitle} className={inp} /></Field>
            <Field label="Texte d'accroche" hint="Vide = texte d'origine"><textarea name="heroSubtitle" rows={3} defaultValue={home.heroSubtitle} className={area} /></Field>
            <Field label="Bouton principal" hint="Vide = « Rejoindre le groupe »"><input name="heroCta" defaultValue={home.heroCta} className={inp} /></Field>
          </div>
        </Panel>
        <Panel title="Événement mis en avant">
          <Field label="Événement affiché sur la carte de l'accueil" hint="Le premier événement à venir de la liste est utilisé.">
            <select name="events" defaultValue={home.featuredEventIds[0] ?? ""} className={inp}>
              <option value="">Automatique</option>
              {events.filter((e) => e.date >= today).map((e) => <option key={e.id} value={e.id}>{e.title}</option>)}
            </select>
          </Field>
        </Panel>
        <Panel title="Articles mis en avant">
          <p className="mb-3 font-body text-[12.5px] text-mist">Cochez les articles à placer en tête des actualités de l&rsquo;accueil (trois affichés).</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {articles.filter((a) => a.status === "published").map((a) => (
              <label key={a.id} className="flex items-center gap-2.5 font-body text-[13.5px] text-white/85"><input type="checkbox" name="articles" value={a.id} defaultChecked={home.featuredArticleIds.includes(a.id)} className="size-4 accent-[#d90f2c]" />{a.title}</label>
            ))}
          </div>
        </Panel>
        {ctx.can("site.content") && <div><SubmitButton>Enregistrer</SubmitButton></div>}
      </form>
    </>
  );
}
