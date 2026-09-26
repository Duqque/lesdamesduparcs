import { Badge, Field, Flash, PageHeader, Panel, area, inp } from "@/components/admin/ui";
import { SubmitButton } from "@/components/admin/SubmitButton";
import { first, type SP } from "@/lib/admin/params";
import { requireAdmin } from "@/lib/server/admin-auth";
import { settings } from "@/lib/server/admin-store";
import { paymentConfigured } from "@/lib/server/helloasso";
import { saveSettingsAction } from "../actions";

export const metadata = { title: "Configuration · Paiements" };

export default async function PaymentSettingsPage({ searchParams }: { searchParams: Promise<SP> }) {
  await requireAdmin("settings.edit");
  const sp = await searchParams;
  const { payments: p } = await settings.get();
  return (
    <>
      <PageHeader title="Paiements" subtitle="Paramètres de paiement et politique de remboursement." />
      <Flash ok={first(sp.ok)} error={first(sp.erreur)} />
      <Panel title="Prestataire de paiement" className="mb-4">
        <p className="flex items-center gap-3 font-body text-[14px] text-white/85">HelloAsso : {paymentConfigured() ? <Badge tone="green">Configuré</Badge> : <Badge tone="orange">Non configuré</Badge>}</p>
        <p className="mt-2 font-body text-[12.5px] text-mist">Les identifiants (<code>HELLOASSO_CLIENT_ID</code>, <code>HELLOASSO_CLIENT_SECRET</code>, <code>HELLOASSO_ORG_SLUG</code>) se règlent dans les variables d&rsquo;environnement de l&rsquo;hébergement, jamais dans l&rsquo;administration. Le remboursement d&rsquo;un paiement en ligne est demandé à HelloAsso ; s&rsquo;il est refusé, faites-le depuis votre espace HelloAsso puis utilisez « Déjà remboursé ».</p>
        <p className="mt-3 font-body text-[12.5px] text-mist">Adresse de notification à déclarer dans HelloAsso (Intégrations et API &gt; Notifications) : <code className="break-all text-white">{(process.env.NEXT_PUBLIC_SITE_URL ?? "https://votre-site").replace(/\/$/, "")}/api/webhooks/helloasso?k=VOTRE_JETON</code> où le jeton est la valeur de <code>HELLOASSO_WEBHOOK_SECRET</code> (16 caractères minimum). Même sans notification, les paiements sont rapprochés au retour du visiteur et par un contrôle planifié.</p>
      </Panel>
      <Panel>
        <form action={saveSettingsAction.bind(null, "payments")} className="grid gap-4 sm:grid-cols-2">
          <Field label="Devise"><input name="currency" defaultValue={p.currency} className={inp} /></Field>
          <label className="flex items-end gap-2 pb-2.5 font-body text-[13.5px] text-white/85"><input type="checkbox" name="onlinePayment" defaultChecked={p.onlinePayment} className="size-4 accent-[#d90f2c]" /> Paiement en ligne activé</label>
          <Field label="Politique de remboursement" className="sm:col-span-2"><textarea name="refundPolicy" rows={3} defaultValue={p.refundPolicy} className={area} /></Field>
          <div className="sm:col-span-2"><SubmitButton>Enregistrer</SubmitButton></div>
        </form>
      </Panel>
    </>
  );
}
