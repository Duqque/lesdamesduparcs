import Link from "next/link";
import { notFound } from "next/navigation";
import { Download, FileText } from "lucide-react";
import { SubmitButton } from "@/components/admin/SubmitButton";
import { PAY_TONE, STATUS_LABEL, STATUS_TONE } from "@/components/admin/status";
import { Badge, Field, Flash, Kpi, PageHeader, Panel, TableWrap, Td, Th, area, btn, inp } from "@/components/admin/ui";
import { eur, fmtDate, fmtDateLong } from "@/lib/admin/format";
import { first, type SP } from "@/lib/admin/params";
import { guardianRelations } from "@/lib/members";
import { requireAdmin } from "@/lib/server/admin-auth";
import { loadMemberRows } from "@/lib/server/admin-data";
import { TX_STATUS_LABEL, getTransactions, membershipsOf, plans, effectiveStatus } from "@/lib/server/business";
import { getAllEventsAdmin } from "@/lib/server/events";
import { emailConfigured } from "@/lib/server/email";
import { getMemberById, listAllRegistrations } from "@/lib/server/store";
import { addPaymentAction, anonymizeMemberAction, memberPaymentAction, renewMemberAction, sendMemberEmailAction, setMemberStatusAction, updateMemberAction } from "../actions";

export const metadata = { title: "Fiche adhérente" };

const METHODS = [["manual", "À définir"], ["virement", "Virement"], ["cash", "Espèces"], ["cheque", "Chèque"], ["stripe", "Carte"], ["autre", "Autre"]] as const;

export default async function MemberPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<SP> }) {
  const ctx = await requireAdmin("members.view");
  const { id } = await params;
  const sp = await searchParams;
  const stored = await getMemberById(id);
  if (!stored) notFound();
  const { passwordHash: _p, ...m } = stored;
  void _p;
  const pii = ctx.can("members.pii");
  const finance = ctx.can("finance.view");
  const [rows, history, txs, regs, events, planList] = await Promise.all([loadMemberRows(), membershipsOf(id), getTransactions(), listAllRegistrations(), getAllEventsAdmin(), plans.all()]);
  const row = rows.find((r) => r.member.id === id)!;
  const myTx = txs.filter((t) => t.memberNumber === m.memberNumber);
  const myRegs = regs.filter((r) => r.memberNumber === m.memberNumber).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const title = (eid: string) => events.find((e) => e.id === eid)?.title ?? eid;
  const totalPaid = myTx.filter((t) => t.status === "paid").reduce((n, t) => n + t.amountCents, 0);
  const lastPay = myTx.find((t) => t.status === "paid");
  const present = myRegs.filter((r) => r.attended === true).length;
  const absent = myRegs.filter((r) => r.attended === false).length;
  const anonymized = m.status === "anonymized";

  return (
    <>
      <PageHeader
        back={{ href: "/admin/adherentes", label: "Toutes les adhérentes" }}
        title={`${m.firstName} ${m.lastName}`}
        subtitle={<span className="flex flex-wrap items-center gap-3"><span className="tabular-nums">Membre {m.memberNumber}</span><Badge tone={STATUS_TONE[row.status]}>{STATUS_LABEL[row.status]}</Badge></span>}
        actions={
          <>
            <Link href={`/verification/${m.token}`} className={btn.outline}>Page de vérification</Link>
            {pii && !anonymized && <a href={`/api/attestation/${m.token}`} target="_blank" rel="noreferrer" className={btn.outline}><FileText aria-hidden className="size-4" /> Attestation PDF</a>}
          </>
        }
      />
      <Flash ok={first(sp.ok)} error={first(sp.erreur)} />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi label="Membre depuis" value={<span className="text-[26px]">{fmtDateLong(m.joinedAt)}</span>} />
        <Kpi label="Formule" value={<span className="text-[26px]">{row.planName || "—"}</span>} hint={row.expiresAt ? `Expire le ${fmtDate(row.expiresAt)}` : undefined} />
        {finance && <Kpi label="Total versé" value={eur(totalPaid)} hint={lastPay ? `Dernier paiement : ${fmtDate(lastPay.at)}` : "Aucun paiement"} />}
        <Kpi label="Événements" value={myRegs.length} hint={`${present} présence(s) · ${absent} absence(s)`} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Panel title="Informations personnelles">
          <form action={updateMemberAction.bind(null, id)} className="grid gap-4 sm:grid-cols-2">
            <Field label="Prénom"><input name="firstName" defaultValue={m.firstName} className={inp} disabled={anonymized} /></Field>
            <Field label="Nom"><input name="lastName" defaultValue={m.lastName} className={inp} disabled={anonymized} /></Field>
            <Field label="Adresse e-mail"><input name="email" type="email" defaultValue={m.email} className={inp} disabled={anonymized} /></Field>
            <Field label="Téléphone"><input name="phone" defaultValue={m.phone} className={inp} disabled={anonymized} /></Field>
            {pii ? (
              <>
                <Field label="Date de naissance"><input name="birthDate" type="date" defaultValue={m.birthDate} className={inp} disabled={anonymized} /></Field>
                <Field label="Adresse"><input name="line1" defaultValue={m.address.line1} className={inp} disabled={anonymized} /></Field>
                <Field label="Complément"><input name="line2" defaultValue={m.address.line2} className={inp} disabled={anonymized} /></Field>
                <Field label="Code postal"><input name="postalCode" defaultValue={m.address.postalCode} className={inp} disabled={anonymized} /></Field>
                <Field label="Ville"><input name="city" defaultValue={m.address.city} className={inp} disabled={anonymized} /></Field>
                <Field label="Pays"><input name="country" defaultValue={m.address.country} className={inp} disabled={anonymized} /></Field>
              </>
            ) : (
              <p className="sm:col-span-2 font-body text-[12.5px] text-mist">Date de naissance et adresse : réservées aux rôles autorisés.</p>
            )}
            <Field label="Notes internes" className="sm:col-span-2"><textarea name="notes" defaultValue={m.notes} rows={3} className={area} disabled={anonymized} /></Field>
            {ctx.can("members.edit") && !anonymized && <div className="sm:col-span-2"><SubmitButton>Enregistrer</SubmitButton></div>}
          </form>
        </Panel>

        <div className="space-y-4">
          <Panel title="Adhésion">
            <ul className="space-y-3 font-body text-[13.5px]">
              {history.map((h) => (
                <li key={h.id} className="flex items-start justify-between gap-3 border-b border-white/[0.06] pb-3 last:border-0 last:pb-0">
                  <span>
                    <span className="block text-white">{h.planName} · {h.season}</span>
                    <span className="text-[12.5px] text-mist">{fmtDate(h.startsAt)} au {fmtDate(h.endsAt)}{h.renewal ? " · renouvellement" : ""}</span>
                  </span>
                  <Badge tone={{ active: "green", expired: "grey", suspended: "orange", cancelled: "grey" }[effectiveStatus(h)] as "green"}>{{ active: "Active", expired: "Expirée", suspended: "Suspendue", cancelled: "Annulée" }[effectiveStatus(h)]}</Badge>
                </li>
              ))}
              {history.length === 0 && <li className="text-mist">Aucune adhésion.</li>}
            </ul>
            {ctx.can("members.edit") && !anonymized && (
              <form action={renewMemberAction.bind(null, id)} className="mt-5 grid gap-3 border-t border-line pt-4">
                <p className="font-body text-[12px] font-semibold uppercase tracking-[0.12em] text-mist">Renouveler ou ajouter une adhésion</p>
                <select name="planId" className={inp} defaultValue={planList[0]?.id}>{planList.map((p) => <option key={p.id} value={p.id}>{p.name} · {eur(p.promoPriceCents ?? p.priceCents)}</option>)}</select>
                <div className="grid grid-cols-2 gap-3">
                  <select name="method" className={inp}>{METHODS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
                  <label className="flex items-center gap-2 font-body text-[13px] text-white/80"><input type="checkbox" name="paid" value="1" className="size-4 accent-[#d90f2c]" /> Déjà réglée</label>
                </div>
                <SubmitButton variant="outline">Renouveler</SubmitButton>
              </form>
            )}
          </Panel>

          {pii && m.guardian && (
            <Panel title="Responsable légal">
              <p className="font-body text-[14px] text-white">{m.guardian.firstName} {m.guardian.lastName} <span className="text-mist">({guardianRelations[m.guardian.relation].toLowerCase()})</span></p>
              <p className="mt-1 font-body text-[13px] text-mist">{m.guardian.email} · {m.guardian.phone}</p>
              <ul className="mt-3 space-y-1.5">
                {m.authorizations.map((f) => (
                  <li key={f.id}><a href={`/api/members/${m.token}/autorisation/${f.id}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 font-body text-[13px] text-white underline decoration-white/30 underline-offset-4 hover:decoration-white"><FileText aria-hidden className="size-3.5" />{f.name}</a></li>
                ))}
                {m.authorizations.length === 0 && <li className="font-body text-[13px] text-[#ff9aa8]">Aucune autorisation parentale déposée.</li>}
              </ul>
            </Panel>
          )}
        </div>
      </div>

      {finance && (
        <Panel className="mt-4" title="Paiements" flush>
          <TableWrap>
            <thead><tr><Th>Date</Th><Th>Objet</Th><Th>Montant</Th><Th>Méthode</Th><Th>Statut</Th><Th>Référence</Th>{ctx.can("finance.edit") && <Th>Actions</Th>}</tr></thead>
            <tbody>
              {myTx.map((t) => (
                <tr key={t.id}>
                  <Td className="tabular-nums">{fmtDate(t.at)}</Td>
                  <Td>{t.type} · {t.label}</Td>
                  <Td className="tabular-nums">{eur(t.amountCents)}</Td>
                  <Td>{t.method}</Td>
                  <Td><Badge tone={PAY_TONE[t.status]}>{TX_STATUS_LABEL[t.status]}</Badge></Td>
                  <Td className="text-[12px] text-mist">{t.reference}</Td>
                  {ctx.can("finance.edit") && (
                    <Td>
                      <div className="flex flex-wrap gap-1.5">
                        {t.status !== "paid" && <form action={memberPaymentAction.bind(null, id, t.id, "paid")}><SubmitButton variant="small">Marquer payé</SubmitButton></form>}
                        {t.status === "paid" && <form action={memberPaymentAction.bind(null, id, t.id, "refunded")}><SubmitButton variant="small" confirm="Marquer ce paiement comme remboursé ? Le remboursement effectif reste à faire auprès du prestataire de paiement.">Rembourser</SubmitButton></form>}
                        {t.status === "pending" && <form action={memberPaymentAction.bind(null, id, t.id, "cancelled")}><SubmitButton variant="small" confirm="Annuler ce paiement ?">Annuler</SubmitButton></form>}
                      </div>
                    </Td>
                  )}
                </tr>
              ))}
              {myTx.length === 0 && <tr><Td colSpan={7} className="text-center text-mist">Aucun paiement.</Td></tr>}
            </tbody>
          </TableWrap>
          {ctx.can("finance.edit") && !anonymized && (
            <form action={addPaymentAction.bind(null, id)} className="grid gap-3 border-t border-line p-5 sm:grid-cols-[2fr_1fr_1fr_auto]">
              <input name="label" placeholder="Objet (ex. Cotisation, goodies)" className={inp} />
              <input name="amount" placeholder="Montant en €" inputMode="decimal" className={inp} required />
              <select name="method" className={inp}>{METHODS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
              <SubmitButton variant="outline">Enregistrer un paiement</SubmitButton>
            </form>
          )}
        </Panel>
      )}

      <Panel className="mt-4" title="Événements" flush>
        <TableWrap>
          <thead><tr><Th>Événement</Th><Th>Inscription</Th><Th>Statut</Th><Th>Présence</Th></tr></thead>
          <tbody>
            {myRegs.map((r) => (
              <tr key={r.id}>
                <Td><Link href={`/admin/evenements/${r.eventId}`} className="hover:text-white">{title(r.eventId)}</Link></Td>
                <Td className="tabular-nums">{fmtDate(r.createdAt)}</Td>
                <Td>{{ confirmed: "Confirmée", paid: "Payée", awaiting_payment: "Paiement en attente", waitlist: "Liste d'attente", cancelled: "Annulée", refunded: "Remboursée" }[r.status]}</Td>
                <Td>{r.attended === true ? <Badge tone="green">Présente</Badge> : r.attended === false ? <Badge tone="red">Absente</Badge> : "—"}</Td>
              </tr>
            ))}
            {myRegs.length === 0 && <tr><Td colSpan={4} className="text-center text-mist">Aucune inscription.</Td></tr>}
          </tbody>
        </TableWrap>
      </Panel>

      <Panel className="mt-4" title="Actions">
        <div className="grid gap-6 lg:grid-cols-2">
          {ctx.can("communication.send") && !anonymized && (
            <form action={sendMemberEmailAction.bind(null, id)} className="grid gap-3">
              <p className="font-body text-[12px] font-semibold uppercase tracking-[0.12em] text-mist">Envoyer un e-mail</p>
              <input name="subject" placeholder="Objet" className={inp} required />
              <textarea name="body" placeholder="Message" rows={4} className={area} required />
              <div className="flex items-center gap-3"><SubmitButton variant="outline">Envoyer</SubmitButton>{!emailConfigured() && <span className="font-body text-[12px] text-amber-300">Aucun service d&rsquo;e-mail configuré : l&rsquo;envoi sera seulement consigné.</span>}</div>
            </form>
          )}
          <div className="flex flex-wrap content-start gap-2">
            {ctx.can("members.edit") && !anonymized && (row.status === "suspended" ? (
              <form action={setMemberStatusAction.bind(null, id, "active")}><SubmitButton variant="outline">Réactiver l&rsquo;adhésion</SubmitButton></form>
            ) : (
              <form action={setMemberStatusAction.bind(null, id, "suspended")}><SubmitButton variant="outline" confirm="Suspendre cette adhésion ?">Suspendre</SubmitButton></form>
            ))}
            {ctx.can("members.export") && !anonymized && <a href={`/admin/export/membre/${id}`} className={btn.outline}><Download aria-hidden className="size-4" /> Exporter ses données</a>}
            {ctx.can("members.delete") && !anonymized && (
              <form action={anonymizeMemberAction.bind(null, id)}><SubmitButton variant="danger" confirm="Anonymiser définitivement cette fiche ? Les données personnelles et les pièces jointes seront effacées. Cette action est irréversible.">Anonymiser (droit à l&rsquo;effacement)</SubmitButton></form>
            )}
          </div>
        </div>
      </Panel>
    </>
  );
}
