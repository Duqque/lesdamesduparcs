import { CampaignForm } from "@/components/admin/CampaignForm";
import { Flash, PageHeader } from "@/components/admin/ui";
import { first, type SP } from "@/lib/admin/params";
import { requireAdmin } from "@/lib/server/admin-auth";
import { segmentOptions } from "@/lib/server/comms";

export const metadata = { title: "Nouvelle campagne" };

export default async function NewCampaignPage({ searchParams }: { searchParams: Promise<SP> }) {
  await requireAdmin("communication.send");
  const sp = await searchParams;
  return (
    <>
      <PageHeader back={{ href: "/admin/communication", label: "Campagnes" }} title="Nouvelle campagne" />
      <Flash error={first(sp.erreur)} />
      <CampaignForm segments={await segmentOptions()} />
    </>
  );
}
