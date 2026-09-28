import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { SubmitButton } from "@/components/admin/SubmitButton";
import { Flash, PageHeader, Panel, inp } from "@/components/admin/ui";
import { first, type SP } from "@/lib/admin/params";
import { ERROR_PAGES } from "@/data/errors";
import { requireAdmin } from "@/lib/server/admin-auth";
import { settings } from "@/lib/server/admin-store";
import { saveErrorPhotosAction } from "../actions";

export const metadata = { title: "Pages d'erreur" };

export default async function ErrorPagesAdmin({ searchParams }: { searchParams: Promise<SP> }) {
  await requireAdmin("site.content");
  const sp = await searchParams;
  const custom = (await settings.get()).errorPhotos ?? {};
  return (
    <>
      <PageHeader title="Pages d'erreur" subtitle="Chaque erreur (404, 500, paiement, session expirée, maintenance…) a sa page aux couleurs du site, avec un bouton « Retour » et un bouton « Page d'accueil ». Changez la photo de fond de chacune, ou revenez à la photo d'origine." />
      <Flash ok={first(sp.ok)} error={first(sp.erreur)} />
      <form action={saveErrorPhotosAction} encType="multipart/form-data">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {ERROR_PAGES.map((e) => (
            <Panel key={e.slug} title={`${e.code} · ${e.title}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={custom[e.slug] || e.photo} alt="" className="aspect-[16/8] w-full rounded-[10px] border border-line object-cover" />
              <div className="mt-3 grid gap-2">
                <input type="file" name={`photo:${e.slug}`} accept="image/jpeg,image/png,image/webp" className={inp} aria-label={`Nouvelle photo pour ${e.title}`} />
                {custom[e.slug] && <label className="flex items-center gap-2 font-body text-[13px] text-white/80"><input type="checkbox" name={`reset:${e.slug}`} className="size-4 accent-[#d90f2c]" /> Revenir à la photo d&rsquo;origine</label>}
                <Link href={`/erreur/${e.slug}`} target="_blank" className="inline-flex items-center gap-1.5 text-[13px] text-white/80 hover:text-white">Voir la page <ExternalLink aria-hidden className="size-3.5" /></Link>
              </div>
            </Panel>
          ))}
        </div>
        <div className="mt-4"><SubmitButton>Enregistrer les photos</SubmitButton></div>
        <p className="mt-3 font-body text-[12.5px] text-mist">Photos conseillées : JPEG, PNG ou WebP, 1920 × 1080 px minimum (paysage), 12 Mo maximum.</p>
      </form>
    </>
  );
}
