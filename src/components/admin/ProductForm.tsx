import { saveProductAction } from "@/app/admin/(panel)/boutique/actions";
import { NO_SIZE } from "@/lib/shop";
import type { Product } from "@/lib/server/shop";
import { SubmitButton } from "./SubmitButton";
import { Field, Panel, area, inp } from "./ui";

interface Props {
  product?: Product;
  categories: string[];
  can: { edit: boolean; pricing: boolean; stock: boolean };
}

/** Fiche produit : chaque bloc (contenu, prix, stock) n'est modifiable qu'avec la permission correspondante. */
export function ProductForm({ product: p, categories, can }: Props) {
  const sizes = p?.sizes ?? [];
  return (
    <form action={saveProductAction} className="grid gap-4">
      {p && <input type="hidden" name="id" value={p.id} />}
      <Panel title="Fiche produit">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nom" className="sm:col-span-2"><input name="name" defaultValue={p?.name} required disabled={!can.edit} className={inp} /></Field>
          {!p && <Field label="Adresse (slug)" hint="Générée depuis le nom si vide"><input name="slug" className={inp} /></Field>}
          <Field label="Catégorie"><input name="category" list="shop-cats" defaultValue={p?.category} disabled={!can.edit} className={inp} /><datalist id="shop-cats">{categories.map((c) => <option key={c} value={c} />)}</datalist></Field>
          <Field label="Référence (SKU)"><input name="sku" defaultValue={p?.sku} disabled={!can.edit} className={inp} /></Field>
          <Field label="Accroche" className="sm:col-span-2"><input name="tagline" defaultValue={p?.tagline} disabled={!can.edit} className={inp} /></Field>
          <Field label="Description" className="sm:col-span-2"><textarea name="description" rows={4} defaultValue={p?.description} disabled={!can.edit} className={area} /></Field>
          <Field label="Caractéristiques (une par ligne)" className="sm:col-span-2"><textarea name="details" rows={4} defaultValue={p?.details.join("\n")} disabled={!can.edit} className={area} /></Field>
          <Field label="Tailles (séparées par des virgules, vide si sans taille)" hint="Ex. XS, S, M, L, XL"><input name="sizes" defaultValue={sizes.join(", ")} disabled={!can.edit} className={inp} /></Field>
          <Field label="Ordre d'affichage"><input name="order" type="number" defaultValue={p?.order} disabled={!can.edit} className={inp} /></Field>
        </div>
      </Panel>
      <Panel title="Photos">
        <div className="grid gap-4">
          <Field label="Adresses des images (une par ligne, la première est l'image principale)"><textarea name="images" rows={3} defaultValue={p?.images.join("\n")} disabled={!can.edit} className={area} /></Field>
          <Field label="Ou envoyer des photos" hint="Ajoutées à la médiathèque et à la fiche"><input type="file" name="imageFiles" accept="image/*" multiple disabled={!can.edit} className="block w-full font-body text-[13px] text-white/80 file:mr-3 file:rounded-[7px] file:border file:border-white/20 file:bg-white/[0.05] file:px-3 file:py-2 file:text-white" /></Field>
        </div>
      </Panel>
      <Panel title="Prix" action={!can.pricing && <span className="font-body text-[12px] text-mist">Lecture seule pour votre rôle</span>}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Prix TTC (€)"><input name="price" inputMode="decimal" defaultValue={p ? p.priceCents / 100 : ""} disabled={!can.pricing} className={inp} /></Field>
          <Field label="Ancien prix barré (€), facultatif"><input name="compareAt" inputMode="decimal" defaultValue={p?.compareAtCents ? p.compareAtCents / 100 : ""} disabled={!can.pricing} className={inp} /></Field>
        </div>
      </Panel>
      <Panel title="Stock" action={!can.stock && <span className="font-body text-[12px] text-mist">Lecture seule pour votre rôle</span>}>
        <label className="mb-4 flex items-center gap-2 font-body text-[13.5px] text-white/85"><input type="checkbox" name="trackStock" defaultChecked={p?.trackStock ?? true} disabled={!can.stock} className="size-4 accent-[#d90f2c]" /> Suivre le stock (le produit devient « épuisé » à zéro)</label>
        <div className="grid gap-4 sm:grid-cols-5">
          {(sizes.length ? sizes : [NO_SIZE]).map((z) => (
            <Field key={z} label={z === NO_SIZE ? "Quantité" : `Taille ${z}`}><input name={`stock:${z}`} type="number" min={0} defaultValue={p?.stock[z] ?? 0} disabled={!can.stock} className={inp} /></Field>
          ))}
        </div>
        {!p && <p className="mt-3 font-body text-[12px] text-mist">Pour un produit avec tailles, enregistrez d&rsquo;abord la fiche, puis saisissez les quantités par taille.</p>}
      </Panel>
      <Panel title="Mise en vente">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Statut"><select name="status" defaultValue={p?.status ?? "draft"} disabled={!can.edit} className={inp}><option value="draft">Brouillon (invisible)</option><option value="active">En vente</option><option value="archived">Archivé</option></select></Field>
          <label className="flex items-end gap-2 pb-2.5 font-body text-[13.5px] text-white/85"><input type="checkbox" name="isNew" defaultChecked={p?.isNew} disabled={!can.edit} className="size-4 accent-[#d90f2c]" /> Afficher la pastille « Nouveau »</label>
        </div>
      </Panel>
      {can.edit && <div><SubmitButton>{p ? "Enregistrer" : "Créer le produit"}</SubmitButton></div>}
    </form>
  );
}
