import { SubmitButton } from "@/components/admin/SubmitButton";
import { Flash, PageHeader, Panel, inp } from "@/components/admin/ui";
import { NAV_ITEMS } from "@/lib/admin/site-pages";
import { first, type SP } from "@/lib/admin/params";
import { requireAdmin } from "@/lib/server/admin-auth";
import { siteConfig } from "@/lib/server/content";
import { saveNavigationAction } from "../actions";

export const metadata = { title: "Navigation du site" };

export default async function NavigationPage({ searchParams }: { searchParams: Promise<SP> }) {
  await requireAdmin("site.structure");
  const sp = await searchParams;
  const { navigation } = await siteConfig.get();
  return (
    <>
      <PageHeader title="Navigation" subtitle="Réservé à la super administratrice : renommez ou masquez les liens du menu principal." />
      <Flash ok={first(sp.ok)} error={first(sp.erreur)} />
      <form action={saveNavigationAction}>
        <Panel flush>
          <ul className="divide-y divide-white/[0.06]">
            {NAV_ITEMS.map((n) => (
              <li key={n.href} className="grid gap-3 px-5 py-4 sm:grid-cols-[1fr_1.4fr_auto] sm:items-center">
                <span className="font-body text-[14px] text-white">{n.label} <span className="text-mist">({n.href})</span></span>
                <input name={`label:${n.href}`} defaultValue={navigation.labels[n.href] ?? ""} placeholder={n.label} aria-label={`Libellé de ${n.label}`} className={inp} />
                <label className="flex items-center gap-2 font-body text-[13.5px] text-white/85"><input type="checkbox" name={`hide:${n.href}`} defaultChecked={navigation.hidden.includes(n.href)} className="size-4 accent-[#d90f2c]" />Masquer</label>
              </li>
            ))}
          </ul>
        </Panel>
        <div className="mt-4"><SubmitButton>Enregistrer</SubmitButton></div>
      </form>
    </>
  );
}
