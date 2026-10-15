import { reissueTicketAction, resendTicketAction } from "@/app/admin/(panel)/evenements/actions";
import { code128Svg } from "@/lib/code128";
import type { Registration } from "@/lib/registration";
import { SubmitButton } from "./SubmitButton";

/** Billet d'une inscription dans l'administration : code-barres, code, PDF et nouveau billet en cas de perte (l'ancien est annulé). */
export function TicketCell({ r, returnTo, canEdit }: { r: Registration; returnTo: string; canEdit: boolean }) {
  const valid = r.status === "confirmed" || r.status === "paid";
  if (!r.ticketCode)
    return valid ? (
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <a href={`/admin/billets/${r.id}`} target="_blank" rel="noopener" className="text-[12px] text-psg-red-bright underline underline-offset-4">Émettre le billet (PDF)</a>
        {canEdit && (
          <form action={resendTicketAction.bind(null, r.id, returnTo)}>
            <SubmitButton variant="small" confirm={`Émettre le billet et l'envoyer par e-mail à ${r.email} ?`}>Envoyer le billet par e-mail</SubmitButton>
          </form>
        )}
      </div>
    ) : (
      <span className="text-[12px] text-mist">{r.status === "awaiting_payment" ? "Après paiement" : "—"}</span>
    );
  return (
    <div className="min-w-[160px]">
      <span aria-hidden className="block h-8 w-[160px] overflow-hidden rounded-[3px] bg-white p-1 [&>svg]:size-full" dangerouslySetInnerHTML={{ __html: code128Svg(r.ticketCode, 40, 6) }} />
      <span className="mt-1 block font-mono text-[11.5px] tabular-nums tracking-[0.08em] text-white/85">{r.ticketCode}</span>
      {valid ? (
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
          <a href={`/admin/billets/${r.id}`} target="_blank" rel="noopener" className="text-[12px] text-psg-red-bright underline underline-offset-4">Voir le billet</a>
          {canEdit && (
            <>
              <form action={resendTicketAction.bind(null, r.id, returnTo)}>
                <SubmitButton variant="small" confirm={`Envoyer le billet n° ${r.ticketCode} par e-mail à ${r.email} ?`}>Envoyer le billet par e-mail</SubmitButton>
              </form>
              <form action={reissueTicketAction.bind(null, r.id, returnTo)}>
                <SubmitButton variant="small" confirm={`Billet perdu : émettre un nouveau billet pour ${r.firstName} ${r.lastName} et l'envoyer par e-mail à ${r.email} ? L'ancien billet (n° ${r.ticketCode}) sera annulé et refusé à l'entrée.`}>Nouveau billet et envoi par e-mail</SubmitButton>
              </form>
            </>
          )}
        </div>
      ) : (
        <span className="text-[12px] text-mist">Billet invalide (inscription {r.status === "cancelled" ? "annulée" : r.status === "refunded" ? "remboursée" : "non confirmée"})</span>
      )}
      {r.revokedTicketCodes?.length ? <span className="mt-1 block text-[11px] text-mist">{r.revokedTicketCodes.length} ancien{r.revokedTicketCodes.length > 1 ? "s" : ""} billet{r.revokedTicketCodes.length > 1 ? "s" : ""} annulé{r.revokedTicketCodes.length > 1 ? "s" : ""}</span> : null}
    </div>
  );
}
