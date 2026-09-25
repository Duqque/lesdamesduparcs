import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { Badge, PageHeader, Panel, TableWrap, Td, Th } from "@/components/admin/ui";
import { SITE_PAGES } from "@/lib/admin/site-pages";
import { requireAdmin } from "@/lib/server/admin-auth";
import { siteConfig } from "@/lib/server/content";

export const metadata = { title: "Pages du site" };

export default async function PagesPage() {
  await requireAdmin("site.structure");
  const { seo } = await siteConfig.get();
  return (
    <>
      <PageHeader title="Pages" subtitle="Les pages du site public. Le contenu de chaque page se gère là où il vit (événements, articles, accueil) ; le référencement se règle dans « Paramètres SEO »." />
      <Panel flush>
        <TableWrap>
          <thead><tr><Th>Page</Th><Th>Adresse</Th><Th>Gestion</Th><Th>SEO</Th><Th></Th></tr></thead>
          <tbody>
            {SITE_PAGES.map((p) => (
              <tr key={p.path}>
                <Td className="font-medium text-white">{p.label}</Td>
                <Td className="text-mist">{p.path}</Td>
                <Td className="text-[13px]">{p.note}</Td>
                <Td>{seo[p.path]?.title || seo[p.path]?.description ? <Badge tone="blue">Personnalisé</Badge> : <Badge>Par défaut</Badge>}</Td>
                <Td><Link href={p.path} className="inline-flex items-center gap-1.5 text-[13px] text-white/80 hover:text-white">Voir <ExternalLink aria-hidden className="size-3.5" /></Link></Td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      </Panel>
    </>
  );
}
