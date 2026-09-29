import { SubmitButton } from "@/components/admin/SubmitButton";
import { Badge, Field, Flash, PageHeader, Panel, area } from "@/components/admin/ui";
import { first, type SP } from "@/lib/admin/params";
import { requireAdmin } from "@/lib/server/admin-auth";
import { settings } from "@/lib/server/admin-store";
import { clearFlashAction, saveFlashAction } from "../actions";

export const metadata = { title: "Bannière flash" };

/** Format attendu par <input type="datetime-local"> : YYYY-MM-DDTHH:mm, en heure locale. */
const toLocalInput = (iso: string) => {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export default async function FlashBannerPage({ searchParams }: { searchParams: Promise<SP> }) {
  await requireAdmin("site.content");
  const sp = await searchParams;
  const { flash } = await settings.get();
  const active = Boolean(flash && new Date(flash.until) > new Date());
  return (
    <>
      <PageHeader title="Bannière flash" subtitle="Message d'information affiché au-dessus du menu, sur tout le site, jusqu'à la date choisie. Chaque visiteuse peut la refermer avec la croix ; elle réapparaît si le message change." />
      <Flash ok={first(sp.ok)} error={first(sp.erreur)} />

      {flash && (
        <Panel className="mb-4" title="Bannière actuelle">
          <p className="font-body text-[14px] leading-[1.7] text-white/85">{flash.message}</p>
          <p className="mt-3 flex items-center gap-2 font-body text-[13px] text-mist">
            <Badge tone={active ? "green" : "grey"}>{active ? "Active" : "Expirée"}</Badge>
            Jusqu&rsquo;au {new Date(flash.until).toLocaleString("fr-FR", { dateStyle: "long", timeStyle: "short" })}
          </p>
          <form action={clearFlashAction} className="mt-4">
            <SubmitButton variant="danger" confirm="Retirer la bannière maintenant ? Elle disparaîtra du site immédiatement.">Retirer maintenant</SubmitButton>
          </form>
        </Panel>
      )}

      <Panel title={flash ? "Remplacer la bannière" : "Publier une bannière"}>
        <form action={saveFlashAction} className="grid grid-cols-1 gap-4">
          <Field label="Message"><textarea name="message" rows={3} defaultValue={flash?.message} className={area} placeholder="Ex. : Les adhésions pour la saison 2026 / 2027 sont actuellement complètes…" /></Field>
          <Field label="Affichée jusqu'au" hint="Passée cette date, la bannière disparaît automatiquement du site."><input name="until" type="datetime-local" defaultValue={flash ? toLocalInput(flash.until) : undefined} className="h-11 w-full max-w-xs rounded-[10px] border border-white/[0.12] bg-[#121417] px-3.5 font-body text-[14.5px] text-white outline-none focus:border-white/30" /></Field>
          <div><SubmitButton>Publier</SubmitButton></div>
        </form>
      </Panel>
    </>
  );
}
