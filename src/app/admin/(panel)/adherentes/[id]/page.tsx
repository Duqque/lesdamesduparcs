import { cookies } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Download, FileText } from "lucide-react";
import { SubmitButton } from "@/components/admin/SubmitButton";
import { PAY_TONE, STATUS_LABEL, STATUS_TONE } from "@/components/admin/status";
import { Badge, Field, Flash, Kpi, PageHeader, Panel, TableWrap, Td, Th, area, btn, inp, lbl } from "@/components/admin/ui";
import { eur, fmtDate, fmtDateLong } from "@/lib/admin/format";
import { first, type SP } from "@/lib/admin/params";
import { guardianRelations } from "@/lib/members";
import { requireAdmin } from "@/lib/server/admin-auth";
import { loadMemberRows } from "@/lib/server/admin-data";
import { TX_STATUS_LABEL, getTransactions, membershipsOf, plans, effectiveStatus } from "@/lib/server/business";
import { getAllEventsAdmin } from "@/lib/server/events";
import { emailConfigured } from "@/lib/server/email";
import { getMemberById, listAllRegistrations } from "@/lib/server/store";
import { invoices } from "@/lib/server/invoice";
import { BirthDateInput } from "@/components/forms/BirthDateInput";
import { LocalityGroup } from "@/components/forms/LocalityGroup";
import { PhoneInput } from "@/components/forms/PhoneInput";
import { addManualLineAction, deleteProfileAction, deleteTestProfileAction, sendMemberResetEmailAction, setMembershipDatesAction, validateMemberCardAction, addPaymentAction, anonymizeMemberAction, memberInviteLinkAction, memberPaymentAction, renewMemberAction, sendMemberEmailAction, setMemberStatusAction, suspendMemberAction, expelMemberAction, updateMemberAction } from "../actions";

export const metadata = { title: "Fiche adhérente" };

const METHODS = [["manual", "À définir"], ["virement", "Virement"], ["cash", "Espèces"], ["cheque", "Chèque"], ["online", "Carte"], ["autre", "Autre"]] as const;

export default async function MemberPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<SP> }) {
  const ctx = await requireAdmin("members.view");
  const { id } = await params;
  const sp = await searchParams;
  const inviteLink = (await cookies()).get("ddp_admin_link")?.value ?? "";
  const stored = await getMemberById(id);
  if (!stored) notFound();
  const { passwordHash: _p, ...m } = stored;
  void _p;
  const pii = ctx.can("members.pii");
  const finance = ctx.can("finance.view");
  const [rows, history, txs, regs, events, planList, memberInvoices] = await Promise.all([loadMemberRows(), membershipsOf(id), getTransactions(), listAllRegistrations(), getAllEventsAdmin(), plans.all(), invoices.find((i) => i.memberNumber === stored.memberNumber)]);
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

      {!anonymized && m.status !== "expelled" && row.kind === "profil" && (
        <Panel className="mb-4" title="Carte de membre en cours de création">
          <p className="font-body text-[13.5px] leading-[1.7] text-amber-100">Ce profil n&rsquo;a pas de carte payée : son QR code affiche « Adhésion invalide ». Dès que vous avez reçu le règlement (espèces, chèque, virement…), validez la carte : elle devient valide et la personne en est informée par e-mail.{row.member.email ? "" : ""}</p>
          {ctx.can("finance.edit") && (
            <form action={validateMemberCardAction.bind(null, id)} className="mt-4 flex flex-wrap items-end gap-3">
              <label><span className={lbl}>Mode de règlement reçu</span><select name="method" className={inp + " mt-1.5"}>{METHODS.filter(([v]) => v !== "manual").map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>
              <SubmitButton confirm="Valider la carte de membre de cette personne ? Le paiement sera enregistré comme reçu et la carte deviendra valide.">Valider la carte (paiement reçu)</SubmitButton>
            </form>
          )}
        </Panel>
      )}      {inviteLink.startsWith("http") && (
        <Panel className="mb-4" title="Lien de première connexion (à transmettre à l'adhérente)">
          <p className="mb-2 font-body text-[12.5px] text-mist">Valable 7 jours, à usage unique. Il ne sera plus affiché après une minute.</p>
          <input readOnly value={inviteLink} className={inp} />
        </Panel>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi label="Membre depuis" value={<span className="text-[26px]">{fmtDateLong(m.joinedAt)}</span>} />
        <Kpi label="Formule" value={<span className="text-[26px]">{row.planName || "—"}</span>} hint={row.expiresAt ? `Expire le ${fmtDate(row.expiresAt)}` : undefined} />
        {finance && <Kpi label="Total versé" value={eur(totalPaid)} hint={lastPay ? `Dernier paiement : ${fmtDate(lastPay.at)}` : "Aucun paiement"} />}
        <Kpi label="Événements" value={myRegs.length} hint={`${present} présence(s) · ${absent} absence(s)`} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Panel title="Informations personnelles">
          <form action={updateMemberAction.bind(null, id)} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Prénom"><input name="firstName" defaultValue={m.firstName} className={inp} disabled={anonymized} /></Field>
            <Field label="Nom"><input name="lastName" defaultValue={m.lastName} className={inp} disabled={anonymized} /></Field>
            <Field label="Adresse e-mail"><input name="email" type="email" defaultValue={m.email} className={inp} disabled={anonymized} /></Field>
            <div><span className="block font-body text-[12px] font-medium uppercase tracking-[0.14em] text-mist">Téléphone</span>{anonymized ? <input name="phone" defaultValue={m.phone} className={inp + " mt-1.5"} disabled /> : <PhoneInput id="e-phone" name="phone" defaultValue={m.phone} className="mt-1.5" />}</div>
            {pii ? (
              <>
                <div><span className="block font-body text-[12px] font-medium uppercase tracking-[0.14em] text-mist">Date de naissance</span>{anonymized ? <input name="birthDate" type="date" defaultValue={m.birthDate} className={inp + " mt-1.5"} disabled /> : <BirthDateInput id="e-birth" name="birthDate" value={m.birthDate} className="mt-1.5" />}</div>
                <Field label="Adresse"><input name="line1" defaultValue={m.address.line1} className={inp} disabled={anonymized} /></Field>
                <Field label="Complément"><input name="line2" defaultValue={m.address.line2} className={inp} disabled={anonymized} /></Field>
                {anonymized ? (<><Field label="Code postal"><input name="postalCode" defaultValue={m.address.postalCode} className={inp} disabled /></Field><Field label="Ville"><input name="city" defaultValue={m.address.city} className={inp} disabled /></Field><Field label="Pays"><input name="country" defaultValue={m.address.country} className={inp} disabled /></Field></>) : <LocalityGroup idPrefix="edit" defaults={{ postalCode: m.address.postalCode, city: m.address.city, country: m.address.country }} />}
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
            {ctx.can("members.edit") && !anonymized && history[0] && (
              <form action={setMembershipDatesAction.bind(null, id)} className="mt-5 grid gap-3 border-t border-line pt-4">
                <p className="font-body text-[12px] font-semibold uppercase tracking-[0.12em] text-mist">Dates exactes de l&rsquo;adhésion en cours</p>
                <div className="grid grid-cols-2 gap-3">
                  <label><span className={lbl}>Début</span><input type="date" name="start" required defaultValue={history[0].startsAt.slice(0, 10)} className={inp + " mt-1.5"} /></label>
                  <label><span className={lbl}>Fin</span><input type="date" name="end" required defaultValue={history[0].endsAt.slice(0, 10)} className={inp + " mt-1.5"} /></label>
                </div>
                <SubmitButton variant="outline">Enregistrer les dates</SubmitButton>
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
                        {t.status === "paid" && <form action={memberPaymentAction.bind(null, id, t.id, "refunded")}><SubmitButton variant="small" confirm="Marquer ce paiement comme remboursé ? Si le paiement a été fait en ligne, le remboursement est demandé automatiquement à HelloAsso.">Rembourser</SubmitButton></form>}
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
            <form action={addManualLineAction.bind(null, id)} className="grid gap-3 border-t border-line p-5 sm:grid-cols-2 lg:grid-cols-4">
              <p className="font-body text-[12px] font-semibold uppercase tracking-[0.12em] text-mist sm:col-span-2 lg:col-span-4">Ajouter une ligne manuelle (test, régularisation, vente sur place)</p>
              <label><span className={lbl}>Type</span><select name="type" className={inp + " mt-1.5"}><option value="autre">Autre paiement</option><option value="boutique">Achat boutique</option><option value="evenement">Événement</option><option value="adhesion">Adhésion</option></select></label>
              <label className="lg:col-span-2"><span className={lbl}>Objet</span><input name="label" placeholder="ex. Cotisation, écharpe, goodies" className={inp + " mt-1.5"} /></label>
              <label><span className={lbl}>Montant (€)</span><input name="amount" placeholder="12" inputMode="decimal" className={inp + " mt-1.5"} /></label>
              <label><span className={lbl}>Mode de paiement</span><select name="method" className={inp + " mt-1.5"}>{METHODS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>
              <label><span className={lbl}>Statut</span><select name="status" className={inp + " mt-1.5"}><option value="paid">Payé (validé)</option><option value="pending">En attente</option></select></label>
              <label><span className={lbl}>Adhésion : début</span><input type="date" name="start" className={inp + " mt-1.5"} /></label>
              <label><span className={lbl}>Adhésion : fin</span><input type="date" name="end" className={inp + " mt-1.5"} /></label>
              <p className="font-body text-[12px] leading-[1.6] text-mist sm:col-span-2 lg:col-span-4">Pour une ligne « Adhésion », le montant est celui de la formule par défaut ; les dates exactes de début et de fin sont facultatives. Une ligne payée génère sa facture ; une adhésion payée valide la carte.</p>
              <div className="sm:col-span-2 lg:col-span-4"><SubmitButton variant="outline">Enregistrer la ligne</SubmitButton></div>
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
            {ctx.can("members.edit") && !anonymized && m.status === "suspended" && (
              <form action={setMemberStatusAction.bind(null, id, "active")}><SubmitButton variant="outline">Lever la suspension maintenant</SubmitButton></form>
            )}
            {ctx.can("members.edit") && !anonymized && m.status !== "expelled" && <form action={sendMemberResetEmailAction.bind(null, id)}><SubmitButton variant="outline" confirm="Envoyer à cette personne, par e-mail, un lien de reconnexion et de changement de mot de passe ?">Envoyer un lien de réinitialisation du mot de passe</SubmitButton></form>}
            {ctx.can("members.delete") && !anonymized && row.kind === "profil" && <form action={deleteProfileAction.bind(null, id)}><SubmitButton variant="danger" confirm="Supprimer définitivement ce profil (fiche, adhésions et paiements non réglés) ? Cette action est irréversible.">Supprimer ce profil</SubmitButton></form>}
            {ctx.can("members.edit") && !anonymized && <form action={memberInviteLinkAction.bind(null, id)}><SubmitButton variant="outline">Générer un lien de connexion</SubmitButton></form>}
            {ctx.can("members.export") && !anonymized && <a href={`/admin/export/membre/${id}`} className={btn.outline}><Download aria-hidden className="size-4" /> Exporter ses données</a>}
            {(ctx.can("members.delete") || ctx.can("privacy.manage")) && !anonymized && (
              <form action={anonymizeMemberAction.bind(null, id)}><SubmitButton variant="danger" confirm="Effacer définitivement les données de cette personne ? Fiche, coordonnées, pièces jointes, inscriptions et commandes sont rendues anonymes (seules les pièces comptables sont conservées). Cette action est irréversible.">Effacer les données (RGPD)</SubmitButton></form>
            )}
            {ctx.admin.role === "super" && !anonymized && row.kind !== "profil" && (
              <form action={deleteTestProfileAction.bind(null, id)}><SubmitButton variant="danger" confirm="Supprimer ce compte comme s'il n'avait jamais existé, y compris ses paiements marqués payés ? Réservé aux comptes de test : pour une vraie adhérente, utilisez plutôt « Effacer les données (RGPD) », qui conserve les pièces comptables. Cette action est irréversible.">Supprimer (compte de test)</SubmitButton></form>
            )}
          </div>
        </div>
      </Panel>

      {finance && (
        <Panel title={`Factures (${memberInvoices.length})`}>
          {memberInvoices.length === 0 ? <p className="font-body text-[13.5px] text-mist">Aucune facture : elles sont éditées automatiquement à chaque paiement validé.</p> : (
            <ul className="divide-y divide-white/[0.06]">
              {[...memberInvoices].sort((a, b) => b.issuedAt.localeCompare(a.issuedAt)).map((i) => (
                <li key={i.id} className="flex flex-wrap items-center justify-between gap-3 py-3 font-body text-[14px]">
                  <span className="min-w-0"><span className="tabular-nums font-medium text-white">{i.number}</span> <span className="text-mist">· {fmtDate(i.issuedAt)} · {i.label} · {i.methodLabel}</span></span>
                  <span className="flex items-center gap-4"><span className="tabular-nums text-white">{eur(i.amountCents)}</span><a href={`/api/factures/${i.id}`} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center gap-1.5 text-white underline decoration-white/25 underline-offset-4 hover:decoration-white"><FileText aria-hidden className="size-4" /> PDF</a></span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      )}

      {!anonymized && (
        <Panel title="Suspension et radiation">
          {m.status === "expelled" && <p className="mb-4 rounded-[10px] border border-psg-red/40 bg-psg-red/10 px-4 py-3 font-body text-[13.5px] text-[#ffb4bf]">Radiée du groupe le {m.statusAt ? fmtDateLong(m.statusAt) : ""}. Motif communiqué : {m.statusReason}</p>}
          {m.status === "suspended" && <p className="mb-4 rounded-[10px] border border-amber-400/30 bg-amber-400/10 px-4 py-3 font-body text-[13.5px] text-amber-100">Suspendue jusqu&rsquo;au {m.suspendedUntil ? fmtDateLong(m.suspendedUntil) : "?"} : rétablie automatiquement à cette date. Motif communiqué : {m.statusReason || "non précisé"}</p>}
          <div className="grid gap-6 lg:grid-cols-2">
            {ctx.can("members.edit") && m.status !== "expelled" && (
              <form action={suspendMemberAction.bind(null, id)} className="grid content-start gap-3">
                <h3 className="font-body text-[14px] font-semibold text-white">Suspension provisoire</h3>
                <p className="font-body text-[12.5px] leading-[1.6] text-mist">La carte devient invalide et l&rsquo;accès aux événements est fermé jusqu&rsquo;à la date choisie, puis l&rsquo;adhésion repart automatiquement. La personne reçoit un e-mail avec la date et le motif.</p>
                <Field label="Date de déblocage"><input type="date" name="until" required min={new Date(Date.now() + 86_400_000).toISOString().slice(0, 10)} defaultValue={m.suspendedUntil} className={inp} /></Field>
                <Field label="Motif (communiqué à la personne)"><textarea name="reason" rows={3} defaultValue={m.statusReason} className={area} /></Field>
                <div><SubmitButton variant="outline" confirm="Suspendre cette adhésion jusqu'à la date choisie ? La personne en sera informée par e-mail.">{m.status === "suspended" ? "Modifier la suspension" : "Suspendre jusqu'à cette date"}</SubmitButton></div>
              </form>
            )}
            {ctx.can("members.delete") && m.status !== "expelled" && (
              <form action={expelMemberAction.bind(null, id)} className="grid content-start gap-3">
                <h3 className="font-body text-[14px] font-semibold text-white">Radiation définitive</h3>
                <p className="font-body text-[12.5px] leading-[1.6] text-mist">Exclut la personne du groupe : adhésion annulée, accès à l&rsquo;espace membre fermé, e-mail de notification avec le motif. Demande une ré-authentification.</p>
                <Field label="Motif (communiqué à la personne, obligatoire)"><textarea name="reason" rows={3} required className={area} /></Field>
                <div><SubmitButton variant="danger" confirm="Radier définitivement cette personne du groupe ? Son adhésion sera annulée et elle en sera informée par e-mail.">Radier définitivement</SubmitButton></div>
              </form>
            )}
          </div>
        </Panel>
      )}
    </>
  );
}
