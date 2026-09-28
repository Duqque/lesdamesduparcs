import { saveArticleAction } from "@/app/admin/(panel)/contenu/actions";
import type { Article } from "@/lib/server/content";
import { MediaPicker } from "./MediaPicker";
import { SubmitButton } from "./SubmitButton";
import { Field, Panel, area, inp } from "./ui";

const toLocal = (iso?: string) => (iso ? new Date(iso).toISOString().slice(0, 16) : "");

export function ArticleForm({ article, categories, defaultAuthor = "" }: { article?: Article; categories: string[]; defaultAuthor?: string }) {
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
          <Field label="Ou envoyer une image" hint="Ajoutée à la médiathèque"><MediaPicker name="imageFile" minWidth={1600} minHeight={900} label="Choisir une image" /></Field>
          <Field label="Texte alternatif de l'image" className="sm:col-span-2"><input name="imageAlt" defaultValue={article?.imageAlt} className={inp} /></Field>
          <Field label="Galerie (une adresse par ligne)"><textarea name="gallery" rows={2} defaultValue={article?.gallery.join("\n")} className={area} /></Field>
          <Field label="Vidéo (adresse)"><input name="video" defaultValue={article?.video} className={inp} /></Field>
        </div>
      </Panel>
      <Panel title="Classement">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Catégorie"><input name="category" list="cats" defaultValue={article?.category} className={inp} /><datalist id="cats">{categories.map((c) => <option key={c} value={c} />)}</datalist></Field>
          <Field label="Tags" hint="Séparés par des virgules. Ils s'affichent à la fin de l'article : un clic sur un tag montre tous les articles du même sujet."><input name="tags" defaultValue={article?.tags.join(", ")} placeholder="ex. Parc des Princes, Déplacement, Portrait" className={inp} /></Field>
          <Field label="Nom de l'auteure" hint="Par défaut, le nom du compte administrateur qui publie."><input name="author" defaultValue={article?.authorName ?? defaultAuthor} className={inp} /></Field>
          <label className="flex items-center gap-2 self-end pb-3 font-body text-[13.5px] text-white/85"><input type="checkbox" name="hideAuthor" defaultChecked={article?.hideAuthor} className="size-4 accent-[#d90f2c]" /> Masquer le nom de l&rsquo;auteure sur l&rsquo;article</label>
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
