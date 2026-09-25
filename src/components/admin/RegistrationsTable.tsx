import Link from "next/link";
import { attendanceAction, registrationAction } from "@/app/admin/(panel)/evenements/actions";
import type { Registration } from "@/lib/registration";
import { eur, fmtDate } from "@/lib/admin/format";
import { SubmitButton } from "./SubmitButton";
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
}

/** Liste des inscrites avec les actions de gestion (confirmer, annuler, rembourser, liste d'attente, présence). */
export function RegistrationsTable({ rows, returnTo, eventTitle, canEdit, canFinance, showAttendance, showFinance }: Props) {
  if (rows.length === 0) return <Empty>Aucune inscription.</Empty>;
  return (
    <TableWrap>
      <thead>
        <tr>
          {eventTitle && <Th>Événement</Th>}
          <Th>Nom</Th><Th>Téléphone</Th><Th>Places</Th><Th>Statut</Th>{showFinance && <Th>Montant</Th>}<Th>Date</Th>{showAttendance && <Th>Présence</Th>}{canEdit && <Th>Actions</Th>}
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.id} className="hover:bg-white/[0.02]">
            {eventTitle && <Td><Link href={`/admin/evenements/${r.eventId}`} className="hover:text-white">{eventTitle(r.eventId)}</Link></Td>}
            <Td><span className="block text-white">{r.firstName} {r.lastName}</span><span className="text-[12px] text-mist">{r.email}</span></Td>
            <Td>{r.phone}</Td>
            <Td className="tabular-nums">{r.places}</Td>
            <Td><Badge tone={TONE[r.status]}>{LABEL[r.status]}</Badge></Td>
            {showFinance && <Td className="tabular-nums">{r.amountCents ? eur(r.amountCents) : "Gratuit"}</Td>}
            <Td className="tabular-nums">{fmtDate(r.createdAt)}</Td>
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
                  {r.status === "paid" && canFinance && r.amountCents > 0 && <form action={registrationAction.bind(null, r.eventId, r.id, "refund", returnTo)}><SubmitButton variant="small" confirm="Marquer comme remboursée ? Le remboursement effectif reste à faire auprès du prestataire.">Rembourser</SubmitButton></form>}
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
