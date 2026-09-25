import { ArrowDown, ArrowUp, Eye, EyeOff } from "lucide-react";
import { SubmitButton } from "@/components/admin/SubmitButton";
import { Badge, Flash, PageHeader, Panel } from "@/components/admin/ui";
import { HOME_SECTIONS } from "@/data/home-sections";
import { first, type SP } from "@/lib/admin/params";
import { requireAdmin } from "@/lib/server/admin-auth";
import { siteConfig } from "@/lib/server/content";
import { moveSectionAction, resetSectionsAction, toggleSectionAction } from "../actions";

export const metadata = { title: "Sections de l'accueil" };

export default async function SectionsPage({ searchParams }: { searchParams: Promise<SP> }) {
  await requireAdmin("site.structure");
  const sp = await searchParams;
  const { home } = await siteConfig.get();
  const keys = HOME_SECTIONS.map((s) => s.key as string);
  const order = [...home.sectionOrder.filter((k) => keys.includes(k)), ...keys.filter((k) => !home.sectionOrder.includes(k))];
  const label = (k: string) => HOME_SECTIONS.find((s) => s.key === k)!.label;
  return (
    <>
      <PageHeader title="Sections de l'accueil" subtitle="Réservé à la super administratrice : réordonnez ou masquez les rubriques de la page d'accueil. L'en-tête reste toujours en tête." />
      <Flash ok={first(sp.ok)} error={first(sp.erreur)} />
      <Panel flush>
        <ol className="divide-y divide-white/[0.06]">
          {order.map((k, i) => {
            const hidden = home.hiddenSections.includes(k);
            return (
              <li key={k} className="flex items-center gap-4 px-5 py-3.5">
                <span className="w-6 font-display text-[18px] font-semibold tabular-nums text-mist">{i + 1}</span>
                <span className="flex-1 font-body text-[14.5px] text-white">{label(k)} {hidden && <Badge tone="grey">Masquée</Badge>}</span>
                <div className="flex gap-1.5">
                  <form action={moveSectionAction.bind(null, k, "up")}><SubmitButton variant="small"><ArrowUp aria-hidden className="size-3.5" /><span className="sr-only">Monter</span></SubmitButton></form>
                  <form action={moveSectionAction.bind(null, k, "down")}><SubmitButton variant="small"><ArrowDown aria-hidden className="size-3.5" /><span className="sr-only">Descendre</span></SubmitButton></form>
                  <form action={toggleSectionAction.bind(null, k)}><SubmitButton variant="small">{hidden ? <><Eye aria-hidden className="size-3.5" /> Afficher</> : <><EyeOff aria-hidden className="size-3.5" /> Masquer</>}</SubmitButton></form>
                </div>
              </li>
            );
          })}
        </ol>
      </Panel>
      <form action={resetSectionsAction} className="mt-4"><SubmitButton variant="outline" confirm="Rétablir l'ordre par défaut ?">Rétablir l&rsquo;ordre par défaut</SubmitButton></form>
    </>
  );
}
