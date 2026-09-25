import Link from "next/link";
import { Empty, PageHeader, Panel, TableWrap, Td, Th } from "@/components/admin/ui";
import { eur, fmtDate } from "@/lib/admin/format";
import { requireAdmin } from "@/lib/server/admin-auth";
import { eventsAnalytics } from "@/lib/server/analytics";

export const metadata = { title: "Analytics · Événements" };

export default async function EventsAnalyticsPage() {
  const ctx = await requireAdmin("analytics.view");
  const rows = await eventsAnalytics();
  const fin = ctx.can("finance.view");
  return (
    <>
      <PageHeader title="Événements" subtitle="Inscriptions, remplissage, annulations, présences et recettes." />
      <Panel flush>
        {rows.length === 0 ? <Empty>Aucun événement avec inscription.</Empty> : (
          <TableWrap>
            <thead><tr><Th>Événement</Th><Th>Date</Th><Th>Inscrites</Th><Th>Remplissage</Th><Th>Annulations</Th><Th>Présentes</Th><Th>Absentes</Th>{fin && <Th>Recettes</Th>}</tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <Td><Link href={`/admin/evenements/${r.id}`} className="text-white hover:underline">{r.title}</Link></Td>
                  <Td className="tabular-nums">{fmtDate(r.date)}</Td>
                  <Td className="tabular-nums">{r.registered}{r.capacity ? ` / ${r.capacity}` : ""}</Td>
                  <Td className="tabular-nums">{r.capacity ? `${Math.round(r.fill)} %` : "—"}</Td>
                  <Td className="tabular-nums">{r.cancelled}</Td><Td className="tabular-nums">{r.present}</Td><Td className="tabular-nums">{r.absent}</Td>
                  {fin && <Td className="tabular-nums">{eur(r.revenue)}</Td>}
                </tr>
              ))}
            </tbody>
          </TableWrap>
        )}
      </Panel>
    </>
  );
}
