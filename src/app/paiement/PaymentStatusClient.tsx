"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { CheckCircle2, Clock, RotateCw, XCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { clearCart } from "@/lib/cart";
import { formatPrice } from "@/lib/money";

interface OrderStatus {
  orderNumber?: string;
  status: "PENDING" | "PAYMENT_PENDING" | "PAID" | "CANCELLED" | "FAILED" | "REFUNDED" | "PARTIALLY_REFUNDED";
  totalCents: number;
  discountCents: number;
  promoCode?: string;
  hasMembership: boolean;
  lines: Array<{ name: string; size?: string; qty: number; unitCents: number }>;
  retryPossible: boolean;
}

/**
 * Pages de retour de paiement. Le retour depuis HelloAsso n'est JAMAIS une preuve de paiement : l'état affiché vient du serveur
 * (notification HelloAsso + relecture du paiement). Tant que ce n'est pas confirmé : « paiement en cours de confirmation ».
 */
export function PaymentStatusClient({ mode }: { mode: "retour" | "erreur" | "annule" }) {
  const params = useSearchParams();
  const id = params.get("order") ?? "";
  const token = params.get("t") ?? "";
  const [order, setOrder] = useState<OrderStatus | null | undefined>(undefined);
  const [waited, setWaited] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const started = useRef(Date.now());

  useEffect(() => {
    let stop = false;
    let timer: ReturnType<typeof setTimeout>;
    const load = async () => {
      try {
        const r = await fetch(`/api/orders/${encodeURIComponent(id)}?t=${encodeURIComponent(token)}`, { cache: "no-store" });
        const data = r.ok ? ((await r.json()) as OrderStatus) : null;
        if (stop) return;
        setOrder(data);
        setWaited(Math.round((Date.now() - started.current) / 1000));
        if (data?.status === "PAID") clearCart();
        // Interroge le serveur toutes les 3 s pendant 3 minutes tant que le paiement n'est pas confirmé.
        if (data && data.status === "PAYMENT_PENDING" && mode === "retour" && Date.now() - started.current < 180_000) timer = setTimeout(load, 3000);
      } catch {
        if (!stop) setOrder(null);
      }
    };
    void load();
    return () => {
      stop = true;
      clearTimeout(timer);
    };
  }, [id, token, mode]);

  const retry = useCallback(async () => {
    setBusy(true);
    setError("");
    try {
      const r = await fetch(`/api/orders/${encodeURIComponent(id)}/retry`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ t: token }) });
      const out = (await r.json()) as { checkoutUrl?: string; error?: string };
      if (out.checkoutUrl) {
        window.location.href = out.checkoutUrl;
        return;
      }
      setError(out.error ?? "Impossible de relancer le paiement.");
    } catch {
      setError("Impossible de relancer le paiement. Vérifiez votre connexion.");
    } finally {
      setBusy(false);
    }
  }, [id, token]);

  const status = order?.status;
  const paid = status === "PAID";
  const pending = status === "PAYMENT_PENDING" || status === "PENDING";
  const failed = status === "FAILED" || (mode === "erreur" && pending);
  const cancelledView = mode === "annule" && pending;

  return (
    <main className="mx-auto max-w-[760px] px-[var(--gutter)] pb-40 pt-[200px] md:pt-[250px]">
      {order === undefined && <p className="font-body text-mist">Chargement…</p>}
      {order === null && (
        <>
          <h1 className="t-h1">Commande introuvable</h1>
          <p className="mt-6 font-body text-[15.5px] text-mist">Le lien est invalide ou a expiré.</p>
          <div className="mt-8"><Button href="/boutique" size="lg">Retour à la boutique</Button></div>
        </>
      )}
      {order && (
        <>
          <p role="status" className="flex items-center gap-3 t-eyebrow">
            {paid ? <CheckCircle2 aria-hidden className="size-5" /> : failed || status === "CANCELLED" ? <XCircle aria-hidden className="size-5" /> : <Clock aria-hidden className="size-5" />}
            {paid ? "Paiement confirmé" : failed ? "Paiement non abouti" : cancelledView ? "Paiement annulé" : status === "REFUNDED" || status === "PARTIALLY_REFUNDED" ? "Commande remboursée" : "Paiement sécurisé"}
          </p>
          <h1 className="mt-5 t-h1">
            {paid ? "Merci pour votre commande" : failed ? "Le paiement n’a pas abouti" : cancelledView ? "Paiement annulé" : status === "CANCELLED" ? "Commande annulée" : status === "REFUNDED" || status === "PARTIALLY_REFUNDED" ? "Commande remboursée" : "Confirmation en cours"}
          </h1>
          <p className="mt-6 text-mist t-lead">
            {paid
              ? `Votre commande ${order.orderNumber ?? ""} est confirmée. Un e-mail de confirmation et votre facture vous sont envoyés.${order.hasMembership ? " Votre adhésion est activée : retrouvez votre carte membre dans votre espace." : ""}`
              : failed
                ? "Aucun montant n’a été débité pour cette tentative. Votre commande est conservée : vous pouvez réessayer sans recomposer votre panier."
                : cancelledView
                  ? "Vous êtes revenue avant de payer. Votre commande est conservée quelque temps : vous pouvez reprendre le paiement à tout moment."
                  : status === "CANCELLED"
                    ? "Cette commande a été annulée."
                    : status === "REFUNDED" || status === "PARTIALLY_REFUNDED"
                      ? "Le remboursement a été effectué par HelloAsso."
                      : waited < 60
                        ? "Votre paiement est en cours de confirmation. Cela prend quelques secondes."
                        : "La confirmation prend un peu plus de temps que prévu. Vous pouvez fermer cette page : dès que le paiement est confirmé, votre commande est validée automatiquement et vous recevez un e-mail."}
          </p>

          {pending && mode === "retour" && (
            <p className="mt-6 flex items-center gap-3 font-body text-[14px] text-white/80"><RotateCw aria-hidden className="size-4 animate-spin" /> Vérification auprès de HelloAsso…</p>
          )}

          <div className="mt-12 rounded-[16px] border border-white/10 bg-[#0b1327]/90 p-7">
            <p className="font-body text-[12.5px] text-mist">Commande <span className="tabular-nums text-white/85">{order.orderNumber ?? id.slice(0, 8).toUpperCase()}</span></p>
            <ul className="mt-4 divide-y divide-white/10">
              {order.lines.map((l) => (
                <li key={`${l.name}-${l.size ?? ""}`} className="flex justify-between gap-4 py-3 font-body text-[14.5px] text-white">
                  <span>{l.qty} × {l.name}{l.size ? ` (${l.size})` : ""}</span>
                  <span className="tabular-nums">{formatPrice(l.unitCents * l.qty)}</span>
                </li>
              ))}
              {order.hasMembership && <li className="flex justify-between gap-4 py-3 font-body text-[14.5px] text-white"><span>Adhésion</span><span className="text-mist">incluse</span></li>}
            </ul>
            <dl className="mt-3 space-y-2 border-t border-white/10 pt-4 font-body text-[14px]">
              {order.discountCents > 0 && <div className="flex justify-between text-mist"><dt>Code {order.promoCode}</dt><dd className="tabular-nums text-emerald-300">−{formatPrice(order.discountCents)}</dd></div>}
              <div className="flex justify-between text-[16px] font-medium text-white"><dt>Total TTC</dt><dd className="tabular-nums">{formatPrice(order.totalCents)}</dd></div>
            </dl>
          </div>

          {error && <p role="alert" className="mt-6 rounded-[10px] border border-psg-red/40 bg-psg-red/10 px-4 py-3 font-body text-[13.5px] text-[#ff9aa8]">{error}</p>}
          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            {(failed || cancelledView) && order.retryPossible && <Button size="lg" onClick={retry} disabled={busy}>{busy ? "Ouverture du paiement…" : "Réessayer le paiement"}</Button>}
            {paid ? <Button href="/profil" size="lg">Ouvrir mon espace</Button> : <Button href="/boutique" size="lg" variant="outline">Retour à la boutique</Button>}
            {paid && <Button href="/boutique" size="lg" variant="outline">Continuer mes achats</Button>}
          </div>
          {!paid && <p className="mt-8 font-body text-[13px] text-mist">Un souci ? <Link href="/contact" className="text-white underline decoration-white/30 underline-offset-4 hover:decoration-white">Contactez-nous</Link> en indiquant votre numéro de commande.</p>}
        </>
      )}
    </main>
  );
}
