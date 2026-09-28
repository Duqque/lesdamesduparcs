import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { SubmitButton } from "@/components/admin/SubmitButton";
import { Flash, PageHeader, Panel, TableWrap, Td, Th, inp } from "@/components/admin/ui";
import { first, type SP } from "@/lib/admin/params";
import { SITE_PAGES } from "@/lib/admin/site-pages";
import { requireAdmin } from "@/lib/server/admin-auth";
import { siteConfig } from "@/lib/server/content";
import { savePageStatesAction } from "../actions";

export const metadata = { title: "Pages : affichage et maintenance" };

export default async function PagesPage({ searchParams }: { searchParams: Promise<SP> }) {
  await requireAdmin("site.content");
  const sp = await searchParams;
  const { pageStates, seo } = await siteConfig.get();
  return (
    <>
      <PageHeader title="Pages : affichage et maintenance" subtitle="Cachez une page (la Boutique par exemple), mettez-la en maintenance ou en « bientôt disponible » en un clic. Une page masquée disparaît des menus, qui se réorganisent automatiquement. Les administratrices connectées voient toujours les pages pour pouvoir les préparer." />
      <Flash ok={first(sp.ok)} error={first(sp.erreur)} />
      <form action={savePageStatesAction}>
        <Panel flush>
          <TableWrap>
            <thead><tr><Th>Page</Th><Th>État</Th><Th>Message (maintenance ou bientôt disponible)</Th><Th>Aperçu</Th></tr></thead>
            <tbody>
              {SITE_PAGES.map((p) => {
                const st = pageStates?.[p.path];
                return (
                  <tr key={p.path} className="align-top">
                    <Td><span className="font-medium text-white">{p.label}</span><span className="block text-[12px] text-mist">{p.path === "*" ? "Tout le site" : p.path} · {p.note}{seo[p.path]?.title ? " · SEO personnalisé" : ""}</span></Td>
                    <Td>
                      <select name={`state:${p.path}`} defaultValue={st?.state ?? "live"} className={inp} aria-label={`État de ${p.label}`}>
                        <option value="live">En ligne</option>
                        <option value="hidden">Masquée (retirée des menus)</option>
                        <option value="maintenance">Maintenance</option>
                        <option value="soon">Bientôt disponible</option>
                      </select>
                    </Td>
                    <Td><input name={`message:${p.path}`} defaultValue={st?.message} placeholder="Message personnalisé (facultatif)" maxLength={300} className={inp} aria-label={`Message de ${p.label}`} /></Td>
                    <Td>{p.path !== "*" ? <Link href={p.path} className="inline-flex items-center gap-1.5 text-[13px] text-white/80 hover:text-white">Voir <ExternalLink aria-hidden className="size-3.5" /></Link> : null}</Td>
                  </tr>
                );
              })}
            </tbody>
          </TableWrap>
          <div className="border-t border-line p-5"><SubmitButton confirm="Enregistrer l'état des pages ? Le changement est immédiat pour les visiteuses.">Enregistrer</SubmitButton></div>
        </Panel>
      </form>
    </>
  );
}
