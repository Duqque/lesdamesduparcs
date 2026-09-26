import { SubmitButton } from "@/components/admin/SubmitButton";
import { Field, Flash, PageHeader, Panel, inp } from "@/components/admin/ui";
import { first, type SP } from "@/lib/admin/params";
import { DEFAULT_GROUP_PHOTOS, GROUP_SLOTS } from "@/lib/group-photos";
import { requireAdmin } from "@/lib/server/admin-auth";
import { mediaDb } from "@/lib/server/content";
import { mediaUrl } from "@/lib/server/media";
import { getGroupPhotos } from "@/lib/server/site";
import { saveGroupPhotosAction } from "../actions";

export const metadata = { title: "Photos du groupe" };

export default async function GroupPhotosPage({ searchParams }: { searchParams: Promise<SP> }) {
  await requireAdmin("site.content");
  const sp = await searchParams;
  const [photos, media] = await Promise.all([getGroupPhotos(), mediaDb.all()]);
  const images = media.filter((m) => m.mime.startsWith("image/") && m.mime !== "image/svg+xml").sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return (
    <>
      <PageHeader title="Photos du groupe" subtitle="Une photo de supporters par chapitre de la rubrique « Le groupe » (en-tête de chaque page et vignette de la liste). Choisissez une photo de la médiathèque, envoyez-en une nouvelle ou collez une adresse. Laissez « Photo par défaut » pour revenir à la photo d'origine." />
      <Flash ok={first(sp.ok)} error={first(sp.erreur)} />
      <form action={saveGroupPhotosAction} className="grid gap-4">
        {GROUP_SLOTS.map((slot) => {
          const current = photos[slot.slug];
          const isDefault = current.src === DEFAULT_GROUP_PHOTOS[slot.slug].src;
          const inLibrary = images.some((m) => mediaUrl(m) === current.src);
          return (
            <Panel key={slot.slug} title={slot.label}>
              <div className="grid gap-5 md:grid-cols-[220px_1fr]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={current.src} alt={current.alt} loading="lazy" className="aspect-[4/3] w-full rounded-[10px] border border-line object-cover" />
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="Photo de la médiathèque" className="sm:col-span-2">
                    <select name={`src_${slot.slug}`} defaultValue={isDefault ? "" : inLibrary ? current.src : ""} className={inp}>
                      <option value="">Photo par défaut</option>
                      {images.map((m) => <option key={m.id} value={mediaUrl(m)}>{m.name}</option>)}
                    </select>
                  </Field>
                  <Field label="Ou envoyer une nouvelle photo" hint="JPEG, PNG, WebP ; 12 Mo maximum. Elle est ajoutée à la médiathèque.">
                    <input type="file" name={`file_${slot.slug}`} accept="image/jpeg,image/png,image/webp,image/gif" className={inp} />
                  </Field>
                  <Field label="Ou adresse d'une image" hint="Lien https:// ou chemin du site (prioritaire sur la liste).">
                    <input name={`url_${slot.slug}`} defaultValue={!isDefault && !inLibrary ? current.src : ""} placeholder="https://…" className={inp} />
                  </Field>
                  <Field label="Description de la photo (pour l'accessibilité)" className="sm:col-span-2">
                    <input name={`alt_${slot.slug}`} defaultValue={current.alt} maxLength={200} className={inp} />
                  </Field>
                  {!isDefault && (
                    <label className="flex items-center gap-2 font-body text-[13.5px] text-white/85 sm:col-span-2"><input type="checkbox" name={`reset_${slot.slug}`} className="size-4 accent-[#d90f2c]" /> Revenir à la photo par défaut</label>
                  )}
                </div>
              </div>
            </Panel>
          );
        })}
        <div><SubmitButton>Enregistrer les photos</SubmitButton></div>
      </form>
    </>
  );
}
