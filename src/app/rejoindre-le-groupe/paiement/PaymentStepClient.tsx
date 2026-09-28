"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, CreditCard, Lock, Wallet } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { Button } from "@/components/ui/Button";
import { formatEuros } from "@/lib/money";
import { membership } from "@/data/membership";

/**
 * Étape qui suit la création du compte : paiement de l'adhésion sur la page sécurisée HelloAsso, ou « plus tard » (espèces, chèque…).
 * Dans ce second cas, la carte de membre est validée MANUELLEMENT par l'équipe des Dames du Parc.
 */
export function PaymentStepClient() {
  const { session, refresh } = useAuth();
  const params = useSearchParams();
  const [promo, setPromo] = useState("");
  const [quote, setQuote] = useState<{ baseCents: number; discountCents: number; amountCents: number; label?: string } | null>(null);
  const [promoError, setPromoError] = useState("");
  const [busy, setBusy] = useState<"" | "pay" | "later" | "promo">("");
  const [error, setError] = useState(params.get("erreur") ? "Le paiement n’a pas abouti. Vous pouvez réessayer ou choisir de payer plus tard." : "");
  const [done, setDone] = useState<"" | "later" | "free">("");
  const state = session.status === "member" ? session.membership : null;

  useEffect(() => {
    if (session.status !== "member") return;
    let live = true;
    fetch("/api/members/adhesion", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ check: true }) })
      .then((r) => r.json())
      .then((d: { baseCents?: number; amountCents?: number; discountCents?: number }) => live && d.baseCents !== undefined && setQuote({ baseCents: d.baseCents, discountCents: d.discountCents ?? 0, amountCents: d.amountCents ?? d.baseCents }))
      .catch(() => undefined);
    return () => {
      live = false;
    };
  }, [session.status]);

  async function call(body: Record<string, unknown>) {
    const res = await fetch("/api/members/adhesion", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    return { ok: res.ok, out: (await res.json()) as { error?: string; url?: string; state?: string; free?: boolean; offline?: boolean; message?: string; baseCents?: number; amountCents?: number; discountCents?: number; label?: string } };
  }

  async function applyPromo() {
    setPromoError("");
    if (!promo.trim()) {
      setQuote((q) => (q ? { ...q, discountCents: 0, amountCents: q.baseCents, label: undefined } : q));
      return;
    }
    setBusy("promo");
    try {
      const { ok, out } = await call({ promoCode: promo, check: true });
      if (!ok) setPromoError(out.error ?? "Code invalide.");
      else setQuote({ baseCents: out.baseCents ?? 0, discountCents: out.discountCents ?? 0, amountCents: out.amountCents ?? 0, label: out.label });
    } catch {
      setPromoError("Vérification impossible. Réessayez.");
    } finally {
      setBusy("");
    }
  }

  async function pay() {
    setBusy("pay");
    setError("");
    try {
      const { ok, out } = await call({ promoCode: promo || undefined });
      if (!ok) return setError(out.error ?? "Impossible de lancer le paiement.");
      if (out.url) {
        window.location.href = out.url;
        return;
      }
      if (out.free) {
        await refresh();
        return setDone("free");
      }
      setError(out.message ?? "Le paiement en ligne n’est pas disponible pour le moment. Vous pouvez choisir de payer plus tard.");
    } catch {
      setError("Impossible de lancer le paiement. Vérifiez votre connexion.");
    } finally {
      setBusy("");
    }
  }

  async function later() {
    setBusy("later");
    setError("");
    try {
      const res = await fetch("/api/members/adhesion/differer", { method: "POST" });
      const out = (await res.json()) as { error?: string };
      if (!res.ok) return setError(out.error ?? "Impossible d’enregistrer votre choix.");
      await refresh();
      setDone("later");
    } catch {
      setError("Impossible d’enregistrer votre choix. Vérifiez votre connexion.");
    } finally {
      setBusy("");
    }
  }

  const amount = quote?.amountCents ?? membership.price * 100;
  return (
    <main className="mx-auto max-w-[760px] px-[var(--gutter)] pb-40 pt-[200px] md:pt-[250px]">
      {session.status === "loading" && <p className="font-body text-mist">Chargement…</p>}
      {session.status === "anon" && (
        <>
          <p className="t-eyebrow">Adhésion</p>
          <h1 className="mt-4 t-h1">Connectez-vous pour continuer</h1>
          <p className="mt-6 text-mist t-lead">Connectez-vous à votre compte pour régler votre adhésion.</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row"><Button href="/connexion" size="lg">Se connecter</Button><Button href="/rejoindre-le-groupe/inscription" size="lg" variant="outline" arrow={false}>Créer un compte</Button></div>
        </>
      )}
      {session.status === "admin" && <p className="font-body text-mist">Cette page est réservée aux adhérentes.</p>}

      {session.status === "member" && state === "active" && !done && (
        <>
          <p className="flex items-center gap-3 t-eyebrow"><CheckCircle2 aria-hidden className="size-5" /> Adhésion active</p>
          <h1 className="mt-4 t-h1">Votre adhésion est active</h1>
          <p className="mt-6 text-mist t-lead">Votre carte de membre est valide : retrouvez-la dans votre espace.</p>
          <div className="mt-8"><Button href="/profil" size="lg">Ouvrir mon espace</Button></div>
        </>
      )}

      {session.status === "member" && done && (
        <>
          <p className="flex items-center gap-3 t-eyebrow"><CheckCircle2 aria-hidden className="size-5" /> {done === "free" ? "Adhésion activée" : "Compte créé"}</p>
          <h1 className="mt-4 t-h1">{done === "free" ? "Bienvenue chez les Dames du Parc" : "Votre compte est créé"}</h1>
          <p className="mt-6 text-mist t-lead">
            {done === "free"
              ? "Votre code offre l’adhésion : votre carte de membre est validée."
              : "Votre carte de membre sera validée manuellement par l’équipe des Dames du Parc dès réception de votre règlement. En attendant, elle reste « en cours de création » et son QR code indique « Adhésion invalide »."}
          </p>
          {done === "later" && <p className="mt-4 font-body text-[14.5px] leading-[1.7] text-white/80">Un e-mail vous a été envoyé avec le lien pour payer en ligne quand vous le souhaitez. Sans règlement, nous vous enverrons un rappel dans 7 puis 15 jours.</p>}
          <div className="mt-8"><Button href="/profil" size="lg">Ouvrir mon espace</Button></div>
        </>
      )}

      {session.status === "member" && state && state !== "active" && !done && (
        <>
          <p className="t-eyebrow">Dernière étape</p>
          <h1 className="mt-4 t-h1">Finalisez votre adhésion</h1>
          <p className="mt-6 text-mist t-lead">Votre compte est créé. Réglez votre adhésion pour que votre carte de membre et son QR code soient validés.</p>

          <div className="mt-10 rounded-[16px] border border-white/10 bg-[#0b1327]/90 p-7">
            <div className="flex items-end justify-between gap-6">
              <div>
                <p className="font-body text-[13px] uppercase tracking-[0.18em] text-mist">Adhésion {membership.season}</p>
                <p className="mt-2 font-body text-[14.5px] text-white/85">Carte membre, événements membres, priorité d’inscription, espace privé.</p>
              </div>
              <p className="shrink-0 whitespace-nowrap font-display text-[34px] tabular-nums text-white">{formatEuros(amount)}</p>
            </div>
            {quote && quote.discountCents > 0 && <p className="mt-3 font-body text-[13.5px] text-emerald-300">Code {quote.label} : −{formatEuros(quote.discountCents)} (au lieu de {formatEuros(quote.baseCents)})</p>}
            <div className="mt-6 border-t border-white/10 pt-5">
              <label htmlFor="promo" className="font-body text-[12.5px] font-medium text-white/80">Code promotionnel</label>
              <div className="mt-2 flex gap-2">
                <input id="promo" value={promo} onChange={(e) => setPromo(e.target.value)} className="h-11 min-w-0 flex-1 rounded-[10px] border border-white/[0.12] bg-[#0d1220] px-3 font-body text-[14px] uppercase text-white outline-none focus:border-white/40" />
                <button type="button" onClick={applyPromo} disabled={busy === "promo"} className="h-11 rounded-[10px] border border-white/20 px-4 font-body text-[13.5px] font-medium text-white hover:border-white/50">Appliquer</button>
              </div>
              {promoError && <p role="alert" className="mt-2 font-body text-[12.5px] text-[#ff8b9b]">{promoError}</p>}
            </div>
          </div>

          {error && <p role="alert" className="mt-6 rounded-[10px] border border-psg-red/40 bg-psg-red/10 px-4 py-3 font-body text-[13.5px] text-[#ff9aa8]">{error}</p>}

          <div className="mt-8 grid gap-4">
            <button type="button" onClick={pay} disabled={busy !== ""} className="inline-flex min-h-[58px] w-full items-center justify-center gap-3 rounded-[10px] border border-[#ff6b80]/45 bg-[linear-gradient(180deg,#e51b36_0%,#b30d27_100%)] px-6 font-body text-[16px] font-medium text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.22),0_12px_30px_-14px_rgba(217,15,44,0.85)] hover:brightness-110 disabled:opacity-60">
              <CreditCard aria-hidden className="size-5" /> {busy === "pay" ? "Ouverture du paiement…" : `Payer ${formatEuros(amount)} en ligne`}
            </button>
            <p className="flex items-start gap-3 font-body text-[13px] text-mist"><Lock aria-hidden className="mt-0.5 size-4 shrink-0" /> Paiement sécurisé par HelloAsso, sur une page hébergée par HelloAsso. Aucun numéro de carte n’est saisi ni conservé sur ce site.</p>

            <div className="mt-2 rounded-[14px] border border-white/10 bg-black/20 p-5">
              <p className="flex items-center gap-3 font-body text-[15px] font-medium text-white"><Wallet aria-hidden className="size-5 text-white/80" /> Payer en espèces, par chèque ou plus tard</p>
              <p className="mt-2 font-body text-[13.5px] leading-[1.7] text-mist">Vous pouvez passer cette étape. <strong className="text-white">Votre carte de membre devra alors être validée manuellement par les administratrices des Dames du Parc</strong> dès réception de votre règlement. Vous recevrez par e-mail le lien pour payer en ligne, puis un rappel dans 7 et 15 jours si le paiement n’est toujours pas validé.</p>
              <button type="button" onClick={later} disabled={busy !== ""} className="mt-4 inline-flex min-h-11 items-center rounded-[10px] border border-white/20 px-5 font-body text-[14px] font-medium text-white hover:border-white/45 disabled:opacity-60">{busy === "later" ? "Enregistrement…" : "Passer cette étape"}</button>
            </div>
          </div>
          <p className="mt-10 font-body text-[13px] text-mist">Une question ? <Link href="/contact" className="text-white underline decoration-white/30 underline-offset-4 hover:decoration-white">Contactez-nous</Link>.</p>
        </>
      )}
    </main>
  );
}
