import Link from "next/link";
import { Plus } from "lucide-react";
import { Badge, Empty, Flash, LinkButton, PageHeader, Panel, TableWrap, Td, Th, type Tone } from "@/components/admin/ui";
import { fmtDateTime } from "@/lib/admin/format";
import { first, type SP } from "@/lib/admin/params";
import { requireAdmin } from "@/lib/server/admin-auth";
import { emailConfigured } from "@/lib/server/email";
import { maybeTick } from "@/lib/server/comms";
import { campaigns } from "@/lib/server/content";

export const metadata = { title: "Campagnes" };

const ST: Record<string, [string, Tone]> = { draft: ["Brouillon", "grey"], scheduled: ["Programmée", "blue"], sent: ["Envoyée", "green"], queued: ["En file d'attente", "orange"] };

export default async function CampaignsPage({ searchParams }: { searchParams: Promise<SP> }) {
  await requireAdmin("communication.send");
  await maybeTick();
  const sp = await searchParams;
  const rows = (await campaigns.all()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return (
    <>
      <PageHeader title="Campagnes" subtitle="Envoyez un message à des groupes d'adhérentes : toutes, nouvelles, participantes à un événement, expirées ou par formule." actions={<LinkButton href="/admin/communication/nouvelle" variant="primary"><Plus aria-hidden className="size-4" /> Nouvelle campagne</LinkButton>} />
      {!emailConfigured() && <p className="mb-6 rounded-[10px] border border-amber-400/30 bg-amber-400/10 px-4 py-3 font-body text-[13.5px] text-amber-100">Aucun service d&rsquo;e-mail n&rsquo;est configuré (variable <code>RESEND_API_KEY</code>) : les campagnes peuvent être préparées et programmées, mais rien n&rsquo;est envoyé tant qu&rsquo;il n&rsquo;est pas branché.</p>}
      <Flash ok={first(sp.ok)} error={first(sp.erreur)} />
      <Panel flush>
        {rows.length === 0 ? <Empty>Aucune campagne.</Empty> : (
          <TableWrap>
            <thead><tr><Th>Objet</Th><Th>Statut</Th><Th>Destinataires</Th><Th>Programmée / envoyée</Th></tr></thead>
            <tbody>
              {rows.map((c) => {
                const [l, t] = ST[c.status];
                return (
                  <tr key={c.id} className="hover:bg-white/[0.02]">
                    <Td><Link href={`/admin/communication/${c.id}`} className="font-medium text-white hover:underline">{c.subject}</Link></Td>
                    <Td><Badge tone={t}>{l}</Badge></Td>
                    <Td className="tabular-nums">{c.recipients}</Td>
                    <Td className="tabular-nums">{fmtDateTime(c.sentAt ?? c.scheduledAt) || "—"}</Td>
                  </tr>
                );
              })}
            </tbody>
          </TableWrap>
        )}
      </Panel>
    </>
  );
}
