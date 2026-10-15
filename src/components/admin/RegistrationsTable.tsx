import Link from "next/link";
import { attendanceAction, registrationAction } from "@/app/admin/(panel)/evenements/actions";
import type { Registration } from "@/lib/registration";
import { eur, fmtDate } from "@/lib/admin/format";
import { SubmitButton } from "./SubmitButton";
import { BulkAll, BulkCheck } from "./Bulk";
import { code128Svg } from "@/lib/code128";
import { Badge, Empty, TableWrap, Td, Th, type Tone } from "./ui";

const LABEL: Record<Registration["status"], string> = { confirmed: "Confirmée", paid: "Payée", awaiting_payment: "Paiement en attente", waitlist: "Liste d'attente", cancelled: "Annulée", refunded: "Remboursée" };
const TONE: Record<Registration["status"], Tone> = { confirmed: "green", paid: "green", awaiting_payment: "orange", waitlist: "blue", cancelled: "grey", refunded: "blue" };

interface Props {
  rows: Registration[];
  returnTo: string;
  eventTitle?: (id: string) => string;
  canEdit: boolean;
  canFinance: boolean;
  showAttendance?: boolean;
  showFinance?: boolean;
  /** Identifiant du formulaire d'actions groupées : ajoute une colonne de cases à cocher. */
  bulkForm?: string;
}

/** Liste des inscrites avec les actions de gestion (confirmer, annuler, rembourser, liste d'attente, présence). */
export function RegistrationsTable({ rows, returnTo, eventTitle, canEdit, canFinance, showAttendance, showFinance, bulkForm }: Props) {
  if (rows.length === 0) return <Empty>Aucune inscription.</Empty>;
  return (
    <TableWrap>
      <thead>
        <tr>
          {bulkForm && <Th className="w-10"><BulkAll form={bulkForm} /></Th>}
          {eventTitle && <Th>Événement</Th>}
          <Th>Nom</Th><Th>Téléphone</Th><Th>Places</Th><Th>Statut</Th>{showFinance && <Th>Montant</Th>}<Th>Date</Th><Th>Billet</Th>{showAttendance && <Th>Présence</Th>}{canEdit && <Th>Actions</Th>}
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.id} className="hover:bg-white/[0.02]">
            {bulkForm && <Td className="w-10"><BulkCheck form={bulkForm} value={r.id} label={`${r.firstName} ${r.lastName}`} /></Td>}
            {eventTitle && <Td><Link href={`/admin/evenements/${r.eventId}`} className="hover:text-white">{eventTitle(r.eventId)}</Link></Td>}
            <Td><span className="block text-white">{r.firstName} {r.lastName}</span><span className="text-[12px] text-mist">{r.email}</span></Td>
            <Td>{r.phone}</Td>
            <Td className="tabular-nums">{r.places}</Td>
            <Td><Badge tone={TONE[r.status]}>{LABEL[r.status]}</Badge></Td>
            {showFinance && <Td className="tabular-nums">{r.amountCents ? eur(r.amountCents) : "Gratuit"}</Td>}
            <Td className="tabular-nums">{fmtDate(r.createdAt)}</Td>
            <Td>
              {r.ticketCode ? (
                <div className="min-w-[150px]">
                  <span aria-hidden className="block h-8 w-[150px] overflow-hidden rounded-[3px] bg-white p-1 [&>svg]:size-full" dangerouslySetInnerHTML={{ __html: code128Svg(r.ticketCode, 40, 6) }} />
                  <span className="mt-1 block font-mono text-[11.5px] tabular-nums tracking-[0.08em] text-white/85">{r.ticketCode}</span>
                  {r.status === "confirmed" || r.status === "paid" ? (
                    <a href={`/admin/billets/${r.id}`} target="_blank" rel="noopener" className="text-[12px] text-psg-red-bright underline underline-offset-4">Voir le billet (PDF)</a>
                  ) : (
                    <span className="text-[12px] text-mist">Billet invalide (inscription {r.status === "cancelled" ? "annulée" : r.status === "refunded" ? "remboursée" : "non confirmée"})</span>
                  )}
                </div>
              ) : (
                r.status === "confirmed" || r.status === "paid" ? (
                  <a href={`/admin/billets/${r.id}`} target="_blank" rel="noopener" className="text-[12px] text-psg-red-bright underline underline-offset-4">Émettre le billet (PDF)</a>
                ) : (
                  <span className="text-[12px] text-mist">{r.status === "awaiting_payment" ? "Après paiement" : "—"}</span>
                )
              )}
            </Td>
            {showAttendance && (
              <Td>
                <div className="flex items-center gap-1.5">
                  {r.attended === true ? <Badge tone="green">Présente</Badge> : r.attended === false ? <Badge tone="red">Absente</Badge> : <span className="text-mist">—</span>}
                  {canEdit && r.status !== "cancelled" && r.status !== "refunded" && r.status !== "waitlist" && (
                    <>
                      <form action={attendanceAction.bind(null, r.id, "present", returnTo)}><SubmitButton variant="small">✓</SubmitButton></form>
                      <form action={attendanceAction.bind(null, r.id, "absent", returnTo)}><SubmitButton variant="small">✕</SubmitButton></form>
                    </>
                  )}
                </div>
              </Td>
            )}
            {canEdit && (
              <Td>
                <div className="flex flex-wrap gap-1.5">
                  {r.status === "waitlist" && <form action={registrationAction.bind(null, r.eventId, r.id, "promote", returnTo)}><SubmitButton variant="small">Confirmer la place</SubmitButton></form>}
                  {r.status === "awaiting_payment" && canFinance && <form action={registrationAction.bind(null, r.eventId, r.id, "paid", returnTo)}><SubmitButton variant="small">Marquer payée</SubmitButton></form>}
                  {(r.status === "paid" || r.status === "confirmed" || r.status === "awaiting_payment") && <form action={registrationAction.bind(null, r.eventId, r.id, "waitlist", returnTo)}><SubmitButton variant="small" confirm="Déplacer vers la liste d'attente ?">Liste d&rsquo;attente</SubmitButton></form>}
                  {r.status === "paid" && canFinance && r.amountCents > 0 && <form action={registrationAction.bind(null, r.eventId, r.id, "refund", returnTo)}><SubmitButton variant="small" confirm="Marquer comme remboursée ? Si le paiement a été fait en ligne, le remboursement est demandé automatiquement à HelloAsso.">Rembourser</SubmitButton></form>}
                  {r.status !== "cancelled" && r.status !== "refunded" && <form action={registrationAction.bind(null, r.eventId, r.id, "cancel", returnTo)}><SubmitButton variant="small" confirm="Annuler cette inscription ?">Annuler</SubmitButton></form>}
                </div>
              </Td>
            )}
          </tr>
        ))}
      </tbody>
    </TableWrap>
  );
}
