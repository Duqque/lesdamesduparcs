"use client";

import { useEffect, useState } from "react";
import { Download, Ticket } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useAuth } from "@/components/auth/AuthProvider";
import { formatEuros, type RegistrationStatus } from "@/lib/registration";
import { formatDay, formatMonthShort } from "@/lib/format";
import type { ClubEvent } from "@/types";

type Mine = { status: RegistrationStatus; amountCents: number } | null;
type State = { mine: Mine; paidCancelled?: { canReactivate: boolean } | null };

/**
 * Barre fixe toujours visible pendant le défilement. Sans billet : « Réserver ma place ». Billet acheté : « Télécharger mon billet »
 * et « Annuler mon billet ». Paiement en attente, liste d'attente ou billet annulé déjà payé : l'action correspondante.
 */
export function ReserveBar({ event }: { event: ClubEvent }) {
  const external = event.registration.mode === "external";
  const { session } = useAuth();
  const member = session.status === "member";
  const [state, setState] = useState<State | null>(null);
  const [ask, setAsk] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!member || external) return;
    let off = false;
    fetch(`/api/events/${event.id}/register`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: State | null) => !off && d && setState({ mine: d.mine, paidCancelled: d.paidCancelled }))
      .catch(() => undefined);
    return () => {
      off = true;
    };
  }, [member, external, event.id]);

  const mine = state?.mine;
  const hasTicket = Boolean(mine && (mine.status === "paid" || (mine.status === "confirmed" && mine.amountCents === 0)));

  async function cancel() {
    setAsk(false);
    setBusy(true);
    try {
      await fetch(`/api/events/${event.id}/register`, { method: "DELETE" });
    } finally {
      // La page est rechargée : formulaire d'inscription, places restantes et barre reflètent l'annulation.
      window.location.reload();
    }
  }

  let action = (
    <Button href={external ? event.href : "#inscription"} size="sm" icon={Ticket} arrow={false} className="w-full md:w-auto">
      Réserver ma place
    </Button>
  );
  if (hasTicket)
    action = (
      <div className="flex w-full items-center gap-2 md:w-auto">
        <Button href={`/api/events/${event.id}/ticket`} download size="sm" icon={Download} arrow={false} className="flex-1 md:flex-none">
          Télécharger mon billet
        </Button>
        <button type="button" onClick={() => setAsk(true)} disabled={busy} className="h-11 shrink-0 rounded-[10px] border border-white/25 px-4 font-body text-[13px] text-white transition-colors hover:bg-white hover:text-night-950 disabled:opacity-60">
          Annuler mon billet
        </button>
      </div>
    );
  else if (mine?.status === "awaiting_payment")
    action = (
      <Button href="#inscription" size="sm" icon={Ticket} arrow={false} className="w-full md:w-auto">
        Finaliser le paiement
      </Button>
    );
  else if (mine?.status === "waitlist")
    action = (
      <Button href="#inscription" size="sm" variant="outline" arrow={false} className="w-full md:w-auto">
        Sur liste d&rsquo;attente
      </Button>
    );
  else if (state?.paidCancelled?.canReactivate)
    action = (
      <Button href="#inscription" size="sm" icon={Ticket} arrow={false} className="w-full md:w-auto">
        Redemander mon billet
      </Button>
    );

  return (
    <div
      role="region"
      aria-label={hasTicket ? "Mon billet" : "Réserver ma place"}
      className="fixed inset-x-3 bottom-3 z-40 transition-[opacity,transform] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] md:inset-x-auto md:bottom-6 md:left-1/2 md:-translate-x-1/2"
    >
      <div className="flex items-center gap-4 rounded-[14px] border border-white/[0.14] bg-night-950/85 p-2 pl-5 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.9)] backdrop-blur-xl md:gap-8 md:p-2.5 md:pl-7">
        <div className="hidden min-w-0 md:block">
          <p className="max-w-[260px] truncate font-body text-[13.5px] font-medium text-white">{event.title}</p>
          <p className="font-body text-[12px] text-mist">
            {formatDay(event.date)} {formatMonthShort(event.date)} · {hasTicket ? "Billet valide" : external ? "Billetterie" : formatEuros(event.registration.priceCents)}
          </p>
        </div>
        {action}
      </div>
      {ask && (
        <ConfirmDialog
          message={mine?.status === "paid" ? "Annuler votre billet ? Il deviendra invalide et votre place sera remise en vente. Le billet n'est pas remboursé ; vous pourrez le redemander jusqu'à 2 h avant l'événement, s'il reste de la place." : "Annuler votre inscription ? Votre place sera remise en vente."}
          confirmLabel="Annuler mon billet"
          cancelLabel="Garder mon billet"
          onConfirm={cancel}
          onCancel={() => setAsk(false)}
        />
      )}
    </div>
  );
}
