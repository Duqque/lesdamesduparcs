import Link from "next/link";
import { FileText, Film } from "lucide-react";
import { DropZone } from "@/components/admin/DropZone";
import { SubmitButton } from "@/components/admin/SubmitButton";
import { Flash, PageHeader, Panel, btn, inp } from "@/components/admin/ui";
import { fmtDate } from "@/lib/admin/format";
import { first, href, type SP } from "@/lib/admin/params";
import { cn } from "@/lib/cn";
import { requireAdmin } from "@/lib/server/admin-auth";
import { articlesDb, mediaDb, partnersDb, siteConfig, type MediaFile } from "@/lib/server/content";
import { eventsDb } from "@/lib/server/events";
import { plans } from "@/lib/server/business";
import { deleteMediaAction, renameMediaAction, replaceMediaAction, uploadMediaAction } from "../actions";

export const metadata = { title: "Médiathèque" };

const FOLDERS = [["", "Toutes"], ["photos", "Photos"], ["videos", "Vidéos"], ["logos", "Logos"], ["affiches", "Affiches"], ["documents", "Documents"]] as const;
const size = (n: number) => (n < 1024 * 1024 ? `${Math.max(1, Math.round(n / 1024))} Ko` : `${(n / 1024 / 1024).toFixed(1)} Mo`);

export default async function MediaPage({ searchParams }: { searchParams: Promise<SP> }) {
  await requireAdmin("media.manage");
  const sp = await searchParams;
  const folder = first(sp.dossier) ?? "";
  const q = first(sp.q)?.toLowerCase();
  const [all, events, arts, pl, partners, cfg] = await Promise.all([mediaDb.all(), eventsDb.all(), articlesDb.all(), plans.all(), partnersDb.all(), siteConfig.get()]);
  const corpus = JSON.stringify([events, arts, pl, partners, cfg]);
  const used = (m: MediaFile) => corpus.includes(`/medias/${m.id}`);
  const list = all.filter((m) => (!folder || m.folder === folder) && (!q || m.name.toLowerCase().includes(q))).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return (
    <>
      <PageHeader title="Médiathèque" subtitle={`${all.length} fichier(s). Chaque fichier a une adresse publique (/medias/…) à coller dans un article, un événement ou une formule.`} />
      <Flash ok={first(sp.ok)} error={first(sp.erreur)} />
      <form action={uploadMediaAction} className="mb-4"><DropZone /></form>
      <Panel className="mb-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <nav aria-label="Dossiers" className="flex flex-wrap gap-1">
            {FOLDERS.map(([k, l]) => <Link key={k} href={href("/admin/site/mediatheque", { dossier: k, q: first(sp.q) })} aria-current={folder === k ? "true" : undefined} className={cn("rounded-[7px] px-3 py-1.5 font-body text-[12.5px]", folder === k ? "bg-white/[0.12] text-white" : "text-mist hover:text-white")}>{l}</Link>)}
          </nav>
          <form method="get" className="flex gap-2"><input type="hidden" name="dossier" value={folder} /><input name="q" defaultValue={first(sp.q)} placeholder="Rechercher un fichier" className={cn(inp, "w-[220px]")} /><button className={btn.outline}>Rechercher</button></form>
        </div>
      </Panel>
      {list.length === 0 ? <p className="py-12 text-center font-body text-mist">Aucun fichier.</p> : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {list.map((m) => (
            <li key={m.id} className="overflow-hidden rounded-[12px] border border-line bg-night-900/85">
              <div className="grid aspect-[4/3] place-items-center bg-black/30">
                {m.mime.startsWith("image/") ? (
                  // eslint-disable-next-line @next/next/no-img-element -- aperçu d'un fichier de la médiathèque
                  <img src={`/medias/${m.id}`} alt={m.name} className="size-full object-cover" loading="lazy" />
                ) : m.mime.startsWith("video/") ? <Film aria-hidden className="size-8 text-mist" /> : <FileText aria-hidden className="size-8 text-mist" />}
              </div>
              <div className="space-y-2 p-3.5">
                <p className="truncate font-body text-[13.5px] font-medium text-white" title={m.name}>{m.name}</p>
                <p className="font-body text-[11.5px] text-mist">{size(m.size)}{m.width ? ` · ${m.width}×${m.height}` : ""} · {fmtDate(m.createdAt)}</p>
                <p className="break-all font-body text-[11.5px] text-white/60">/medias/{m.id}</p>
                <p className="font-body text-[11.5px]">{used(m) ? <span className="text-emerald-300">Utilisé sur le site</span> : <span className="text-mist">Non utilisé</span>}</p>
                <details>
                  <summary className="cursor-pointer font-body text-[12px] text-white/80 hover:text-white">Gérer</summary>
                  <div className="mt-3 space-y-3">
                    <form action={renameMediaAction.bind(null, m.id)} className="flex gap-2"><input name="name" defaultValue={m.name} className={inp} /><SubmitButton variant="small">OK</SubmitButton></form>
                    <form action={replaceMediaAction.bind(null, m.id)} className="space-y-2"><input type="file" name="file" required className="block w-full font-body text-[11.5px] text-white/80" /><SubmitButton variant="small">Remplacer le fichier</SubmitButton></form>
                    <form action={deleteMediaAction.bind(null, m.id)}><SubmitButton variant="danger" confirm={used(m) ? "Ce fichier est utilisé sur le site : le supprimer cassera les images concernées. Continuer ?" : "Supprimer ce fichier ?"}>Supprimer</SubmitButton></form>
                  </div>
                </details>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
