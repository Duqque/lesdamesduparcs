import Link from "next/link";
import { Badge, Empty, PageHeader, Panel, TableWrap, Td, Th, type Tone } from "@/components/admin/ui";
import { fmtDateTime } from "@/lib/admin/format";
import { requireAdmin } from "@/lib/server/admin-auth";
import { adminNotifications } from "@/lib/server/admin-data";
import { emailLog } from "@/lib/server/content";

export const metadata = { title: "Notifications" };

const TONE: Record<string, Tone> = { urgent: "red", important: "orange", info: "green" };
const LABEL = { urgent: "Urgente", important: "Importante", info: "Information" } as const;

export default async function NotificationsPage() {
  const ctx = await requireAdmin("communication.send");
  const [alerts, log] = await Promise.all([adminNotifications(ctx), emailLog.all()]);
  return (
    <>
      <PageHeader title="Notifications" subtitle="Ce qui demande votre attention, et le journal des e-mails du système." />
      <Panel title="Notifications de l'administration" className="mb-4">
        {alerts.length === 0 ? <Empty>Rien à signaler.</Empty> : (
          <ul className="divide-y divide-white/[0.06]">
            {alerts.map((a, i) => <li key={i} className="flex items-center justify-between gap-4 py-3"><Link href={a.href} className="font-body text-[14px] text-white hover:underline">{a.text}</Link><Badge tone={TONE[a.level]}>{LABEL[a.level]}</Badge></li>)}
          </ul>
        )}
      </Panel>
      <Panel title="Journal des e-mails" flush>
        {log.length === 0 ? <Empty>Aucun e-mail.</Empty> : (
          <TableWrap>
            <thead><tr><Th>Date</Th><Th>Destinataire</Th><Th>Objet</Th><Th>Type</Th><Th>Statut</Th></tr></thead>
            <tbody>
              {log.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 100).map((e) => (
                <tr key={e.id}><Td className="tabular-nums">{fmtDateTime(e.createdAt)}</Td><Td>{e.to}</Td><Td>{e.subject}</Td><Td>{e.kind}</Td><Td><Badge tone={e.status === "sent" ? "green" : e.status === "failed" ? "red" : "orange"}>{{ sent: "Envoyé", skipped: "Non envoyé", failed: "Échec" }[e.status]}</Badge></Td></tr>
              ))}
            </tbody>
          </TableWrap>
        )}
      </Panel>
    </>
  );
}
