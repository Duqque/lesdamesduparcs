import { notFound } from "next/navigation";
import { txStatusAction } from "../../../finances/actions";
import { SubmitButton } from "@/components/admin/SubmitButton";
import { FULFIL_LABELS } from "@/components/admin/status-shop";
import { Badge, Flash, PageHeader, Panel, area, inp } from "@/components/admin/ui";
import { eur, fmtDateTime } from "@/lib/admin/format";
import { first, type SP } from "@/lib/admin/params";
import type { Fulfilment } from "@/lib/orders";
import { requireAdmin } from "@/lib/server/admin-auth";
import { getOrder } from "@/lib/server/store";
import { saveOrderNoteAction, setFulfilmentAction } from "../../actions";

export const metadata = { title: "Commande" };

const PAY = { paid: ["Payée", "green"], awaiting_payment: ["En attente de paiement", "orange"], refunded: ["Remboursée", "blue"], cancelled: ["Annulée", "grey"] } as const;

export default async function OrderPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<SP> }) {
  const ctx = await requireAdmin("shop.orders");
  const { id } = await params;
  const sp = await searchParams;
  const o = await getOrder(id);
  if (!o) notFound();
  const [pl, pt] = PAY[o.status];
  const here = `/admin/boutique/commandes/${id}`;
  const step = (s: Fulfilment, label: string, variant: "primary" | "outline" = "outline") => (
    <form action={setFulfilmentAction.bind(null, id, s)}><SubmitButton variant={variant}>{label}</SubmitButton></form>
  );
  const canPay = ctx.can("finance.edit");
  return (
    <>
      <PageHeader back={{ href: "/admin/boutique/commandes", label: "Commandes" }} title={`Commande ${o.id.slice(0, 8).toUpperCase()}`} subtitle={<span className="flex flex-wrap items-center gap-3"><span>{fmtDateTime(o.createdAt)}</span><Badge tone={pt}>{pl}</Badge>{o.status === "paid" && <Badge tone="blue">{FULFIL_LABELS[o.fulfilment ?? "to_prepare"]}</Badge>}</span>} />
      <Flash ok={first(sp.ok)} error={first(sp.erreur)} />
      <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-4">
          <Panel title="Articles" flush>
            <ul className="divide-y divide-white/[0.06]">
              {o.lines.map((l, i) => <li key={i} className="flex justify-between gap-4 px-5 py-3.5 font-body text-[14px]"><span className="text-white">{l.qty} × {l.name}{l.size ? ` (${l.size})` : ""}</span><span className="tabular-nums text-white/85">{eur(l.unitCents * l.qty)}</span></li>)}
            </ul>
            <dl className="space-y-2 border-t border-line px-5 py-4 font-body text-[13.5px]">
              <div className="flex justify-between text-mist"><dt>Sous-total</dt><dd className="tabular-nums text-white/85">{eur(o.subtotalCents)}</dd></div>
              {o.discountCents ? <div className="flex justify-between text-mist"><dt>Code {o.promoCode}</dt><dd className="tabular-nums text-emerald-300">−{eur(o.discountCents)}</dd></div> : null}
              <div className="flex justify-between text-mist"><dt>Livraison</dt><dd className="tabular-nums text-white/85">{o.shippingCents ? eur(o.shippingCents) : "Offerte"}</dd></div>
              <div className="flex justify-between border-t border-line pt-3 text-[15px] font-medium text-white"><dt>Total</dt><dd className="tabular-nums">{eur(o.totalCents)}</dd></div>
            </dl>
          </Panel>
          <Panel title="Note interne">
            <form action={saveOrderNoteAction.bind(null, id)} className="grid gap-3"><textarea name="note" rows={3} defaultValue={o.note} className={area} /><div><SubmitButton variant="outline">Enregistrer la note</SubmitButton></div></form>
          </Panel>
        </div>
        <div className="space-y-4">
          <Panel title="Client">
            <p className="font-body text-[14px] text-white">{o.contact.firstName} {o.contact.lastName}</p>
            <p className="font-body text-[13px] text-mist">{o.contact.email}{o.contact.phone ? ` · ${o.contact.phone}` : ""}</p>
            {o.memberNumber && <p className="mt-1 font-body text-[12.5px] text-mist">Membre {o.memberNumber}</p>}
            <p className="mt-4 font-body text-[12px] font-semibold uppercase tracking-[0.12em] text-mist">Livraison</p>
            {o.delivery.mode === "home" && o.delivery.address ? <p className="mt-1 font-body text-[13.5px] leading-[1.6] text-white/85">{o.delivery.address.line1}<br />{o.delivery.address.line2 && <>{o.delivery.address.line2}<br /></>}{o.delivery.address.postalCode} {o.delivery.address.city}<br />{o.delivery.address.country}</p> : <p className="mt-1 font-body text-[13.5px] text-white/85">Retrait lors d&rsquo;un événement</p>}
          </Panel>
          <Panel title="Préparation et expédition">
            {o.status !== "paid" ? <p className="font-body text-[13.5px] text-mist">La commande doit être réglée avant d&rsquo;être préparée.</p> : (
              <div className="grid gap-4">
                <form action={setFulfilmentAction.bind(null, id, "shipped")} className="grid gap-2">
                  <input name="carrier" defaultValue={o.carrier} placeholder="Transporteur (Colissimo…)" className={inp} />
                  <input name="tracking" defaultValue={o.tracking} placeholder="Numéro de suivi" className={inp} />
                  {o.delivery.mode === "home" && <div><SubmitButton>Marquer expédiée (prévient la cliente)</SubmitButton></div>}
                </form>
                <div className="flex flex-wrap gap-2">
                  {step("preparing", "En préparation")}
                  {o.delivery.mode === "event" && step("ready_for_pickup", "Prête au retrait")}
                  {step("delivered", "Livrée / retirée", "primary")}
                </div>
              </div>
            )}
          </Panel>
          <Panel title="Paiement">
            <p className="font-body text-[13px] text-mist">{o.checkoutId ? "Payé en ligne via HelloAsso : un remboursement est demandé automatiquement à HelloAsso." : "Paiement hors ligne : marquez-le payé à réception."}</p>
            {canPay ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {o.status === "awaiting_payment" && <form action={txStatusAction.bind(null, `order:${id}`, "paid", here)}><SubmitButton>Marquer payée</SubmitButton></form>}
                {o.status === "awaiting_payment" && <form action={txStatusAction.bind(null, `order:${id}`, "cancelled", here)}><SubmitButton variant="outline" confirm="Annuler la commande ? Le stock est remis en vente.">Annuler</SubmitButton></form>}
                {o.status === "paid" && <form action={txStatusAction.bind(null, `order:${id}`, "refunded", here)}><SubmitButton variant="danger" confirm="Rembourser cette commande ? Le stock est remis en vente.">Rembourser</SubmitButton></form>}
                {o.status === "paid" && <form action={txStatusAction.bind(null, `order:${id}`, "refunded", here)}><input type="hidden" name="manual" value="1" /><SubmitButton variant="outline" confirm="Marquer comme remboursée sans lancer de remboursement (déjà fait chez HelloAsso) ? Le stock est remis en vente.">Déjà remboursée</SubmitButton></form>}
              </div>
            ) : <p className="mt-3 font-body text-[12px] text-mist">Le suivi des paiements est réservé aux rôles financiers.</p>}
          </Panel>
        </div>
      </div>
    </>
  );
}
