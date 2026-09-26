import Link from "next/link";
import { SubmitButton } from "@/components/admin/SubmitButton";
import { Field, Flash, PageHeader, Panel, area, inp } from "@/components/admin/ui";
import { first, type SP } from "@/lib/admin/params";
import { requireAdmin } from "@/lib/server/admin-auth";
import { articlesDb, mediaDb, siteConfig } from "@/lib/server/content";
import { mediaUrl } from "@/lib/server/media";
import { DEFAULT_HERO_IMAGE } from "@/lib/hero";
import { getPublishedEvents } from "@/lib/server/events";
import { saveHomeContentAction } from "../actions";

export const metadata = { title: "Accueil du site" };

export default async function HomeEditorPage({ searchParams }: { searchParams: Promise<SP> }) {
  const ctx = await requireAdmin("site.content");
  const sp = await searchParams;
  const [{ home }, events, articles, media] = await Promise.all([siteConfig.get(), getPublishedEvents(), articlesDb.all(), mediaDb.all()]);
  const images = media.filter((m) => m.mime.startsWith("image/") && m.mime !== "image/svg+xml").sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const heroImage = home.heroImage || "";
  const shown = heroImage || DEFAULT_HERO_IMAGE;
  const inLibrary = images.some((m) => mediaUrl(m) === heroImage);
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
        <Panel title="Photo de l'en-tête">
          <div className="grid gap-5 md:grid-cols-[260px_1fr]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={shown} alt={home.heroImageAlt || "Photo actuelle de l'en-tête"} className="aspect-[16/10] w-full rounded-[10px] border border-line object-cover" />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Envoyer une nouvelle photo" hint="JPEG, PNG ou WebP, 12 Mo maximum (paysage, de préférence 2000 px de large). Elle est ajoutée à la médiathèque." className="sm:col-span-2">
                <input type="file" name="heroImageFile" accept="image/jpeg,image/png,image/webp,image/gif" className={inp} />
              </Field>
              <Field label="Ou choisir dans la médiathèque">
                <select name="heroImagePick" defaultValue={inLibrary ? heroImage : ""} className={inp}>
                  <option value="">Garder la photo actuelle</option>
                  {images.map((m) => <option key={m.id} value={mediaUrl(m)}>{m.name}</option>)}
                </select>
              </Field>
              <Field label="Ou adresse d'une image" hint="Lien https:// (prioritaire sur la liste).">
                <input name="heroImageUrl" defaultValue={heroImage && !inLibrary ? heroImage : ""} placeholder="https://…" className={inp} />
              </Field>
              <Field label="Description de la photo (accessibilité)" className="sm:col-span-2"><input name="heroImageAlt" defaultValue={home.heroImageAlt} maxLength={200} className={inp} /></Field>
              {heroImage && <label className="flex items-center gap-2 font-body text-[13.5px] text-white/85 sm:col-span-2"><input type="checkbox" name="resetHeroImage" className="size-4 accent-[#d90f2c]" /> Revenir à la photo d&rsquo;origine</label>}
            </div>
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
