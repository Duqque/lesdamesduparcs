import { notFound } from "next/navigation";
import { CampaignForm } from "@/components/admin/CampaignForm";
import { SubmitButton } from "@/components/admin/SubmitButton";
import { Badge, Flash, PageHeader, Panel } from "@/components/admin/ui";
import { first, type SP } from "@/lib/admin/params";
import { requireAdmin } from "@/lib/server/admin-auth";
import { campaigns } from "@/lib/server/content";
import { recipientsFor, segmentOptions } from "@/lib/server/comms";
import { deleteCampaignAction, sendCampaignAction } from "../actions";

export const metadata = { title: "Campagne" };

export default async function CampaignPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<SP> }) {
  await requireAdmin("communication.send");
  const { id } = await params;
  const sp = await searchParams;
  const c = await campaigns.get(id);
  if (!c) notFound();
  const count = (await recipientsFor(c.audience)).length;
  return (
    <>
      <PageHeader back={{ href: "/admin/communication", label: "Campagnes" }} title={c.subject} subtitle={<span className="flex items-center gap-3"><Badge tone={c.status === "sent" ? "green" : c.status === "queued" ? "orange" : "grey"}>{{ draft: "Brouillon", scheduled: "Programmée", sent: "Envoyée", queued: "En file d'attente" }[c.status]}</Badge>{count} destinataire(s) actuellement</span>} />
      <Flash ok={first(sp.ok)} error={first(sp.erreur)} />
      {c.note && <p className="mb-6 rounded-[10px] border border-amber-400/30 bg-amber-400/10 px-4 py-3 font-body text-[13.5px] text-amber-100">{c.note}</p>}
      <CampaignForm campaign={c} segments={await segmentOptions()} />
      {c.status !== "sent" && (
        <Panel className="mt-4" title="Envoi">
          <div className="flex flex-wrap gap-2">
            <form action={sendCampaignAction.bind(null, id)}><SubmitButton confirm={`Envoyer cette campagne à ${count} destinataire(s) ?`}>Envoyer maintenant</SubmitButton></form>
            <form action={deleteCampaignAction.bind(null, id)}><SubmitButton variant="danger" confirm="Supprimer cette campagne ?">Supprimer</SubmitButton></form>
          </div>
        </Panel>
      )}
    </>
  );
}
