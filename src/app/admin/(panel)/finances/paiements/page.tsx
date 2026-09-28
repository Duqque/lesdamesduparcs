import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { Download } from "lucide-react";
import { SubmitButton } from "@/components/admin/SubmitButton";
import { Badge, Empty, Field, Flash, PageHeader, Panel, TableWrap, Td, Th, btn, inp } from "@/components/admin/ui";
import { eur, fmtDateTime } from "@/lib/admin/format";
import { first, type SP } from "@/lib/admin/params";
import { audit, requireAdmin } from "@/lib/server/admin-auth";
import { emailJobs, resendEmailJob } from "@/lib/server/email-jobs";
import { helloAssoConfig } from "@/lib/server/helloasso";
import { reconcile } from "@/lib/server/payments";
import { haPayments, webhookEvents } from "@/lib/server/payment-records";
import { getOrder, listOrders } from "@/lib/server/store";

export const metadata = { title: "Paiements HelloAsso" };

const back = (m: { ok?: string; erreur?: string }) => redirect(`/admin/finances/paiements?${m.ok ? `ok=${encodeURIComponent(m.ok)}` : `erreur=${encodeURIComponent(m.erreur!)}`}`);

/** Réconciliation : relit le paiement chez HelloAsso à partir de l'identifiant enregistré et applique le résultat (idempotent). */
async function reconcileAction(formData: FormData) {
  "use server";
  const ctx = await requireAdmin("finance.edit");
  const q = String(formData.get("q") ?? "").trim();
  if (!q) back({ erreur: "Indiquez un numéro de commande (DDP-2026-00001)." });
  const order = (await listOrders()).find((o) => o.orderNumber?.toLowerCase() === q.toLowerCase() || o.id === q);
  if (!order) back({ erreur: `Aucune commande « ${q} ».` });
  try {
    const result = await reconcile("order", order!.id);
    await audit(ctx, "modification", "paiement", `Réconciliation de la commande ${order!.orderNumber ?? order!.id.slice(0, 8)} : ${result}`);
    revalidatePath("/admin/finances/paiements");
    back({ ok: `Commande ${order!.orderNumber ?? ""} relue chez HelloAsso : ${({ paid: "paiement confirmé, commande payée", already: "déjà payée", unpaid: "paiement non reçu chez HelloAsso", mismatch: "montant différent : à vérifier", failed: "paiement refusé", refunded: "paiement remboursé", unknown: "aucun paiement HelloAsso rattaché" } as Record<string, string>)[result] ?? result}.` });
  } catch (e) {
    back({ erreur: `HelloAsso : ${e instanceof Error ? e.message : "indisponible"}` });
  }
}

async function resendAction(id: string) {
  "use server";
  const ctx = await requireAdmin("finance.edit");
  await resendEmailJob(id);
  await audit(ctx, "modification", "e-mail", `E-mail de paiement renvoyé (${id.slice(0, 8)})`);
  revalidatePath("/admin/finances/paiements");
  back({ ok: "E-mail remis en file et envoi tenté." });
}

async function replayAction(id: string) {
  "use server";
  const ctx = await requireAdmin("finance.edit");
  const ev = await webhookEvents.get(id);
  if (!ev?.kind || !ev.ref) back({ erreur: "Notification sans référence à rejouer." });
  try {
    const result = await reconcile(ev!.kind as "order" | "registration" | "membership", ev!.ref!);
    await webhookEvents.update(id, { processed: true, processedAt: new Date().toISOString(), result, error: undefined });
    await audit(ctx, "modification", "paiement", `Notification HelloAsso rejouée : ${result}`);
    revalidatePath("/admin/finances/paiements");
    back({ ok: `Notification rejouée : ${result}.` });
  } catch (e) {
    back({ erreur: `Traitement impossible : ${e instanceof Error ? e.message : "erreur"}` });
  }
}

export default async function HelloAssoPaymentsPage({ searchParams }: { searchParams: Promise<SP> }) {
  const ctx = await requireAdmin("finance.view");
  const sp = await searchParams;
  const cfg = helloAssoConfig();
  const [pays, events, jobs, orders] = await Promise.all([haPayments.all(), webhookEvents.all(), emailJobs.all(), listOrders()]);
  const byRef = new Map(orders.map((o) => [o.id, o]));
  void getOrder;
  const edit = ctx.can("finance.edit");
  const sortedPays = [...pays].sort((a, b) => b.paidAt.localeCompare(a.paidAt)).slice(0, 50);
  const sortedEvents = [...events].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 40);
  const sortedJobs = [...jobs].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 40);
  const stuck = orders.filter((o) => (o.status === "awaiting_payment" || o.status === "failed") && o.checkoutId).length;
  return (
    <>
      <PageHeader
        title="Paiements HelloAsso"
        subtitle="Paiements encaissés, notifications reçues de HelloAsso et e-mails de confirmation : de quoi diagnostiquer un paiement non reçu ou renvoyer un e-mail."
        actions={ctx.can("finance.export") && <a href="/admin/export/paiements?format=csv" className={btn.outline}><Download aria-hidden className="size-4" /> CSV / Excel</a>}
      />
      <Flash ok={first(sp.ok)} error={first(sp.erreur)} />
      <div className="mb-4 flex flex-wrap items-center gap-3 rounded-[12px] border border-line px-4 py-3 font-body text-[13.5px] text-white/85">
        <Badge tone={cfg.env === "production" ? "green" : "orange"}>{cfg.env === "production" ? "Production" : "Sandbox (test)"}</Badge>
        {cfg.configured ? <span>HelloAsso est configuré (organisation « {cfg.organizationSlug} »).</span> : <span className="text-amber-200">HelloAsso n&rsquo;est pas configuré : renseignez les variables d&rsquo;environnement (voir README-PAYMENT.md).</span>}
        <span className="text-mist">{stuck} commande(s) en attente de paiement.</span>
      </div>

      {edit && (
        <Panel title="Réconcilier une commande" className="mb-4">
          <form action={reconcileAction} className="flex flex-wrap items-end gap-3">
            <Field label="Numéro de commande" hint="Ex. DDP-2026-00458. Relit le paiement chez HelloAsso et met la commande à jour."><input name="q" required className={inp} /></Field>
            <SubmitButton>Relire chez HelloAsso</SubmitButton>
          </form>
        </Panel>
      )}

      <Panel title={`Paiements encaissés (${pays.length})`} flush className="mb-4">
        {sortedPays.length === 0 ? <Empty>Aucun paiement HelloAsso pour le moment.</Empty> : (
          <TableWrap>
            <thead><tr><Th>Date</Th><Th>Objet</Th><Th>Montant</Th><Th>État</Th><Th>Paiement HelloAsso</Th><Th>Commande HelloAsso</Th></tr></thead>
            <tbody>
              {sortedPays.map((p) => {
                const o = byRef.get(p.ref);
                return (
                  <tr key={p.id}>
                    <Td className="tabular-nums">{fmtDateTime(p.paidAt)}</Td>
                    <Td>{p.kind === "order" ? <a className="underline decoration-white/25 underline-offset-4" href={`/admin/boutique/commandes/${p.ref}`}>{p.orderNumber ?? o?.orderNumber ?? "Commande"}</a> : p.kind === "membership" ? "Adhésion" : "Inscription"}{p.memberNumber && <span className="block text-[12px] text-mist">Membre {p.memberNumber}</span>}</Td>
                    <Td className="tabular-nums">{eur(p.amountCents)}</Td>
                    <Td><Badge tone={p.state === "Authorized" ? "green" : "orange"}>{p.state}</Badge></Td>
                    <Td className="font-mono text-[12.5px]">{p.helloassoPaymentId}</Td>
                    <Td className="font-mono text-[12.5px]">{p.helloassoOrderId}</Td>
                  </tr>
                );
              })}
            </tbody>
          </TableWrap>
        )}
      </Panel>

      <Panel title={`Notifications reçues (${events.length})`} flush className="mb-4">
        {sortedEvents.length === 0 ? <Empty>Aucune notification reçue. Vérifiez l&rsquo;adresse de notification dans votre espace HelloAsso.</Empty> : (
          <TableWrap>
            <thead><tr><Th>Reçue le</Th><Th>Type</Th><Th>Référence</Th><Th>Résultat</Th><Th>Essais</Th>{edit && <Th>Action</Th>}</tr></thead>
            <tbody>
              {sortedEvents.map((e) => (
                <tr key={e.id} className="align-top">
                  <Td className="tabular-nums">{fmtDateTime(e.createdAt)}</Td>
                  <Td>{e.eventType}{e.kind ? ` · ${e.kind}` : ""}</Td>
                  <Td className="font-mono text-[12.5px]">{e.ref?.slice(0, 8) ?? "-"}</Td>
                  <Td>{e.error ? <Badge tone="red">Erreur</Badge> : e.processed ? <Badge tone={e.result === "paid" || e.result === "already" ? "green" : "grey"}>{e.result ?? "traitée"}</Badge> : <Badge tone="orange">En attente</Badge>}{e.error && <span className="mt-1 block text-[12px] text-[#ff9aa8]">{e.error}</span>}</Td>
                  <Td className="tabular-nums">{e.attempts}</Td>
                  {edit && <Td>{e.kind && e.ref ? <form action={replayAction.bind(null, e.id)}><SubmitButton variant="small">Rejouer</SubmitButton></form> : null}</Td>}
                </tr>
              ))}
            </tbody>
          </TableWrap>
        )}
      </Panel>

      <Panel title={`E-mails de paiement (${jobs.length})`} flush>
        {sortedJobs.length === 0 ? <Empty>Aucun e-mail en file.</Empty> : (
          <TableWrap>
            <thead><tr><Th>Créé le</Th><Th>Type</Th><Th>Destinataire</Th><Th>État</Th><Th>Essais</Th>{edit && <Th>Action</Th>}</tr></thead>
            <tbody>
              {sortedJobs.map((j) => (
                <tr key={j.id} className="align-top">
                  <Td className="tabular-nums">{fmtDateTime(j.createdAt)}</Td>
                  <Td>{j.type}</Td>
                  <Td>{j.recipient}</Td>
                  <Td><Badge tone={j.status === "sent" ? "green" : j.status === "pending" ? "orange" : "red"}>{{ sent: "Envoyé", pending: "À envoyer", failed: "Échec, nouvel essai", dead: "Abandonné" }[j.status]}</Badge>{j.lastError && <span className="mt-1 block text-[12px] text-mist">{j.lastError}</span>}</Td>
                  <Td className="tabular-nums">{j.attempts}</Td>
                  {edit && <Td>{j.status !== "sent" ? <form action={resendAction.bind(null, j.id)}><SubmitButton variant="small">Renvoyer</SubmitButton></form> : null}</Td>}
                </tr>
              ))}
            </tbody>
          </TableWrap>
        )}
      </Panel>
    </>
  );
}
