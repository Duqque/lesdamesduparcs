import { SubmitButton } from "@/components/admin/SubmitButton";
import { Badge, Empty, Flash, PageHeader, Panel } from "@/components/admin/ui";
import { fmtDateTime } from "@/lib/admin/format";
import { first, type SP } from "@/lib/admin/params";
import { requireAdmin } from "@/lib/server/admin-auth";
import { contactMessages } from "@/lib/server/content";
import { deleteContactAction, setContactStatusAction } from "./actions";

export const metadata = { title: "Messages reçus" };

const LABEL = { new: "Nouveau", read: "Lu", done: "Traité" } as const;
const TONE = { new: "orange", read: "blue", done: "green" } as const;

export default async function ContactMessagesPage({ searchParams }: { searchParams: Promise<SP> }) {
  await requireAdmin("communication.send");
  const sp = await searchParams;
  const rows = (await contactMessages.all()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const fresh = rows.filter((r) => r.status === "new").length;
  return (
    <>
      <PageHeader title="Messages reçus" subtitle={`Messages envoyés depuis le formulaire de contact du site (${fresh} nouveau${fresh > 1 ? "x" : ""}). Chaque message part aussi par e-mail vers la boîte de l'association, objet « Contact Site Web | Prénom Nom ». Conservés 12 mois.`} />
      <Flash ok={first(sp.ok)} error={first(sp.erreur)} />
      {rows.length === 0 ? (
        <Panel><Empty>Aucun message pour le moment.</Empty></Panel>
      ) : (
        <div className="grid gap-3">
          {rows.map((m) => (
            <Panel key={m.id} title={<span className="flex flex-wrap items-center gap-3"><span>{m.firstName} {m.lastName}</span><Badge tone={TONE[m.status]}>{LABEL[m.status]}</Badge>{!m.delivered && <Badge tone="orange">E-mail non parti</Badge>}</span>} action={<span className="font-body text-[12.5px] tabular-nums text-mist">{fmtDateTime(m.createdAt)}</span>}>
              <p className="whitespace-pre-wrap break-words font-body text-[14px] leading-[1.7] text-white/90">{m.message}</p>
              <p className="mt-4 font-body text-[13px] text-mist">
                <a href={`mailto:${m.email}?subject=${encodeURIComponent("Re : Contact Site Web")}`} className="text-white underline underline-offset-4">{m.email}</a> · <a href={`tel:${m.phone.replace(/\s/g, "")}`} className="text-white underline underline-offset-4">{m.phone}</a>
                {m.handledBy && <span> · traité par {m.handledBy}</span>}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <a href={`mailto:${m.email}?subject=${encodeURIComponent("Re : Contact Site Web")}`} className="inline-flex h-9 items-center rounded-[8px] border border-white/20 px-4 font-body text-[13px] text-white hover:border-white/45">Répondre par e-mail</a>
                {m.status !== "read" && m.status !== "done" && <form action={setContactStatusAction.bind(null, m.id, "read")}><SubmitButton variant="small">Marquer lu</SubmitButton></form>}
                {m.status !== "done" && <form action={setContactStatusAction.bind(null, m.id, "done")}><SubmitButton variant="small">Marquer traité</SubmitButton></form>}
                {m.status !== "new" && <form action={setContactStatusAction.bind(null, m.id, "new")}><SubmitButton variant="outline">Remettre en nouveau</SubmitButton></form>}
                <form action={deleteContactAction.bind(null, m.id)}><SubmitButton variant="danger" confirm="Supprimer ce message ?">Supprimer</SubmitButton></form>
              </div>
            </Panel>
          ))}
        </div>
      )}
    </>
  );
}
