import { saveArticleAction } from "@/app/admin/(panel)/contenu/actions";
import type { Article } from "@/lib/server/content";
import { SubmitButton } from "./SubmitButton";
import { Field, Panel, area, inp } from "./ui";

const toLocal = (iso?: string) => (iso ? new Date(iso).toISOString().slice(0, 16) : "");

export function ArticleForm({ article, categories }: { article?: Article; categories: string[] }) {
  return (
    <form action={saveArticleAction} className="grid gap-4">
      {article && <input type="hidden" name="id" value={article.id} />}
      <Panel title="Contenu">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Titre" className="sm:col-span-2"><input name="title" defaultValue={article?.title} required className={inp} /></Field>
          {!article && <Field label="Adresse (slug)" hint="Générée depuis le titre si vide"><input name="slug" className={inp} /></Field>}
          <Field label="Résumé" className="sm:col-span-2"><textarea name="summary" rows={2} defaultValue={article?.summary} className={area} /></Field>
          <Field label="Texte (paragraphes séparés par une ligne vide)" className="sm:col-span-2"><textarea name="content" rows={14} defaultValue={article?.content} className={area} /></Field>
        </div>
      </Panel>
      <Panel title="Médias">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Image principale (adresse)"><input name="image" defaultValue={article?.image} className={inp} /></Field>
          <Field label="Ou envoyer une image" hint="Ajoutée à la médiathèque"><input type="file" name="imageFile" accept="image/*" className="block w-full font-body text-[13px] text-white/80 file:mr-3 file:rounded-[7px] file:border file:border-white/20 file:bg-white/[0.05] file:px-3 file:py-2 file:text-white" /></Field>
          <Field label="Texte alternatif de l'image" className="sm:col-span-2"><input name="imageAlt" defaultValue={article?.imageAlt} className={inp} /></Field>
          <Field label="Galerie (une adresse par ligne)"><textarea name="gallery" rows={2} defaultValue={article?.gallery.join("\n")} className={area} /></Field>
          <Field label="Vidéo (adresse)"><input name="video" defaultValue={article?.video} className={inp} /></Field>
        </div>
      </Panel>
      <Panel title="Classement">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Catégorie"><input name="category" list="cats" defaultValue={article?.category} className={inp} /><datalist id="cats">{categories.map((c) => <option key={c} value={c} />)}</datalist></Field>
          <Field label="Tags (séparés par des virgules)"><input name="tags" defaultValue={article?.tags.join(", ")} className={inp} /></Field>
          <Field label="Auteure"><input name="author" defaultValue={article?.authorName} className={inp} /></Field>
          <Field label="Date affichée"><input type="date" name="date" defaultValue={article?.date} className={inp} /></Field>
        </div>
      </Panel>
      <Panel title="Référencement (SEO)">
        <div className="grid gap-4">
          <Field label="Titre SEO"><input name="seoTitle" defaultValue={article?.seoTitle} className={inp} /></Field>
          <Field label="Description SEO"><textarea name="seoDescription" rows={2} defaultValue={article?.seoDescription} className={area} /></Field>
        </div>
      </Panel>
      <Panel title="Publication">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Statut"><select name="status" defaultValue={article?.status ?? "draft"} className={inp}><option value="draft">Brouillon</option><option value="published">Publié maintenant</option><option value="scheduled">Programmé</option><option value="archived">Archivé</option></select></Field>
          <Field label="Date de publication programmée"><input type="datetime-local" name="publishAt" defaultValue={toLocal(article?.publishAt)} className={inp} /></Field>
        </div>
      </Panel>
      <div><SubmitButton>{article ? "Enregistrer" : "Créer l'article"}</SubmitButton></div>
    </form>
  );
}
