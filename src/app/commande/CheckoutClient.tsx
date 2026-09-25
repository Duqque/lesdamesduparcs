"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Lock, MapPin, Truck } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { Button } from "@/components/ui/Button";
import { Check, Field, inputCls } from "@/components/ui/form";
import { getProduct, shipping } from "@/data/shop";
import { clearCart, computeTotals, useCartLines } from "@/lib/cart";
import { formatPrice } from "@/lib/money";
import { validateCheckout, type CheckoutInput } from "@/lib/orders";
import { cn } from "@/lib/cn";

const countries = ["France", "Belgique", "Suisse", "Luxembourg", "Allemagne", "Espagne", "Italie", "Portugal"];

function Section({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <fieldset className="border-t border-white/10 pt-8">
      <legend className="flex items-center gap-3 pr-4 font-body text-[16px] font-medium text-white">
        <span className="grid size-7 place-items-center rounded-full border border-white/25 text-[12px] tabular-nums text-white/80">{n}</span>
        {title}
      </legend>
      <div className="mt-6">{children}</div>
    </fieldset>
  );
}

/** Commande : ouverte aux invités (achat rapide, sans compte) comme aux membres connectées. */
export function CheckoutClient() {
  const router = useRouter();
  const params = useSearchParams();
  const { session } = useAuth();
  const lines = useCartLines();
  const totals = computeTotals(lines);
  const member = session.status === "member" ? session : null;

  const [v, setV] = useState({ firstName: "", lastName: "", email: "", phone: "", line1: "", line2: "", postalCode: "", city: "", country: "France" });
  const [touchedPrefill, setTouchedPrefill] = useState(false);
  const [mode, setMode] = useState<"home" | "event">("home");
  const [terms, setTerms] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);

  // Préremplissage à partir de la carte de membre (une seule fois, sans écraser la saisie)
  if (member && !touchedPrefill && !v.email) {
    setTouchedPrefill(true);
    setV((s) => ({ ...s, firstName: member.firstName, lastName: member.lastName, email: member.email }));
  }

  const set = (k: keyof typeof v, value: string) => setV((s) => ({ ...s, [k]: value }));
  const ship = totals.shippingCents(mode);
  const total = totals.subtotalCents + ship;
  const ia = (k: string) => ({ "aria-invalid": Boolean(errors[k]), "aria-describedby": errors[k] ? `c-${k}-err` : undefined });

  const build = (): Partial<CheckoutInput> => ({
    items: lines.map((l) => ({ productId: l.productId, size: l.size, qty: l.qty })),
    contact: { email: v.email, firstName: v.firstName, lastName: v.lastName, phone: v.phone || undefined },
    delivery: { mode, address: mode === "home" ? { line1: v.line1, line2: v.line2 || undefined, postalCode: v.postalCode, city: v.city, country: v.country } : undefined },
    acceptTerms: terms,
  });

  async function submit(e: FormEvent) {
    e.preventDefault();
    setFormError("");
    const local = validateCheckout(build());
    setErrors(local);
    if (Object.keys(local).length) {
      setFormError("Certains champs sont à corriger.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/shop/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(build()) });
      const out = (await res.json()) as { error?: string; errors?: Record<string, string>; checkoutUrl?: string; orderId?: string; token?: string };
      if (!res.ok) {
        setErrors(out.errors ?? {});
        setFormError(out.error ?? "Commande impossible.");
        return;
      }
      if (out.checkoutUrl) {
        window.location.href = out.checkoutUrl;
        return;
      }
      clearCart();
      router.push(`/commande/confirmation?order=${out.orderId}&t=${out.token}&etat=attente-config`);
    } catch {
      setFormError("Commande impossible. Vérifiez votre réseau.");
    } finally {
      setBusy(false);
    }
  }

  if (lines.length === 0) {
    return (
      <main className="mx-auto max-w-[900px] px-[var(--gutter)] pb-40 pt-[200px] md:pt-[250px]">
        <h1 className="t-h1">Commande</h1>
        <p className="mt-8 font-body text-[16px] text-mist">Votre panier est vide.</p>
        <div className="mt-8"><Button href="/boutique" size="lg">Découvrir la boutique</Button></div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-[1200px] px-[var(--gutter)] pb-40 pt-[180px] md:pt-[230px]">
      <h1 className="t-h1">Commande</h1>
      <p className="mt-5 font-body text-[14.5px] text-mist">
        {member ? (
          <>Connectée avec la carte <span className="tabular-nums text-white">{member.memberNumber}</span> : vos informations sont préremplies.</>
        ) : (
          <>Commande sans compte. Vous avez une carte membre ? <Link href="/connexion" className="font-medium text-white underline decoration-white/30 underline-offset-4 hover:decoration-white">Se connecter</Link></>
        )}
      </p>
      {params.get("paiement") === "annule" && <p role="status" className="mt-6 rounded-[12px] border border-psg-red/40 bg-psg-red/10 px-5 py-4 font-body text-[14px] text-[#ff9aa8]">Le paiement a été annulé. Votre panier est conservé.</p>}

      <div className="mt-14 grid gap-14 lg:grid-cols-[1fr_400px] lg:gap-20">
        <form onSubmit={submit} noValidate className="space-y-10">
          <Section n={1} title="Vos coordonnées">
            <div className="grid gap-5 sm:grid-cols-2">
              <Field id="c-firstName" label="Prénom" error={errors.firstName}>
                <input id="c-firstName" value={v.firstName} onChange={(e) => set("firstName", e.target.value)} autoComplete="given-name" className={inputCls} {...ia("firstName")} />
              </Field>
              <Field id="c-lastName" label="Nom" error={errors.lastName}>
                <input id="c-lastName" value={v.lastName} onChange={(e) => set("lastName", e.target.value)} autoComplete="family-name" className={inputCls} {...ia("lastName")} />
              </Field>
              <Field id="c-email" label="Adresse e-mail" hint="Pour la confirmation et le suivi de commande." error={errors.email}>
                <input id="c-email" type="email" value={v.email} onChange={(e) => set("email", e.target.value)} autoComplete="email" className={inputCls} {...ia("email")} />
              </Field>
              <Field id="c-phone" label="Téléphone (facultatif)" error={errors.phone}>
                <input id="c-phone" type="tel" value={v.phone} onChange={(e) => set("phone", e.target.value)} autoComplete="tel" className={inputCls} {...ia("phone")} />
              </Field>
            </div>
          </Section>

          <Section n={2} title="Livraison">
            <div role="radiogroup" aria-label="Mode de livraison" className="grid gap-3 sm:grid-cols-2">
              {([
                { id: "home", icon: Truck, title: "À domicile", text: `${formatPrice(shipping.standardCents)}, offerte dès ${formatPrice(shipping.freeFromCents)}` },
                { id: "event", icon: MapPin, title: "Retrait lors d'un événement", text: "Gratuit, remise en main propre" },
              ] as const).map((o) => (
                <button key={o.id} type="button" role="radio" aria-checked={mode === o.id} onClick={() => setMode(o.id)} className={cn("flex items-start gap-4 rounded-[12px] border p-5 text-left transition-colors", mode === o.id ? "border-white bg-white/[0.07]" : "border-white/15 hover:border-white/40")}>
                  <o.icon aria-hidden className="mt-0.5 size-5 shrink-0 text-white/80" strokeWidth={1.5} />
                  <span>
                    <span className="block font-body text-[14.5px] font-medium text-white">{o.title}</span>
                    <span className="mt-1 block font-body text-[12.5px] text-mist">{o.text}</span>
                  </span>
                </button>
              ))}
            </div>
            {errors.mode && <p role="alert" className="mt-2 text-[12.5px] text-[#ff8b9b]">{errors.mode}</p>}

            {mode === "home" ? (
              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                <Field id="c-line1" label="Adresse" error={errors.line1} className="sm:col-span-2">
                  <input id="c-line1" value={v.line1} onChange={(e) => set("line1", e.target.value)} autoComplete="address-line1" className={inputCls} {...ia("line1")} />
                </Field>
                <Field id="c-line2" label="Complément (facultatif)" className="sm:col-span-2">
                  <input id="c-line2" value={v.line2} onChange={(e) => set("line2", e.target.value)} autoComplete="address-line2" className={inputCls} />
                </Field>
                <Field id="c-postalCode" label="Code postal" error={errors.postalCode}>
                  <input id="c-postalCode" value={v.postalCode} onChange={(e) => set("postalCode", e.target.value)} autoComplete="postal-code" className={inputCls} {...ia("postalCode")} />
                </Field>
                <Field id="c-city" label="Ville" error={errors.city}>
                  <input id="c-city" value={v.city} onChange={(e) => set("city", e.target.value)} autoComplete="address-level2" className={inputCls} {...ia("city")} />
                </Field>
                <Field id="c-country" label="Pays" error={errors.country}>
                  <select id="c-country" value={v.country} onChange={(e) => set("country", e.target.value)} autoComplete="country-name" className={inputCls}>
                    {countries.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </Field>
              </div>
            ) : (
              <p className="mt-6 rounded-[12px] border border-white/10 bg-black/20 p-5 text-mist t-small">Vous retirerez votre commande lors du prochain événement des Dames du Parc. Nous vous écrirons pour convenir de la date et du lieu.</p>
            )}
          </Section>

          <Section n={3} title="Paiement">
            <p className="flex items-start gap-3 text-mist t-small">
              <Lock aria-hidden className="mt-1 size-4 shrink-0" />
              Paiement sécurisé par Stripe (carte bancaire, Apple Pay, Google Pay) sur une page hébergée par Stripe. Aucun numéro de carte n&rsquo;est saisi ni conservé sur ce site.
            </p>
            <div className="mt-6">
              <Check id="c-terms" checked={terms} onChange={setTerms} error={errors.acceptTerms}>
                J&rsquo;ai lu et j&rsquo;accepte les conditions générales de vente. Je peux retourner mon article sous 14 jours.
              </Check>
            </div>
          </Section>

          {formError && <p role="alert" className="rounded-[10px] border border-psg-red/40 bg-psg-red/10 px-4 py-3 font-body text-[13.5px] text-[#ff9aa8]">{formError}</p>}
          <button type="submit" disabled={busy} className="inline-flex h-[56px] w-full items-center justify-center rounded-[10px] border border-[#ff6b80]/45 bg-[linear-gradient(180deg,#e51b36_0%,#b30d27_100%)] font-body text-[16px] font-medium text-white transition-[filter] hover:brightness-110 disabled:opacity-60">
            {busy ? "Traitement en cours…" : `Payer ${formatPrice(total)}`}
          </button>
        </form>

        <aside aria-label="Récapitulatif de commande" className="h-fit rounded-[16px] border border-white/10 bg-[#0b1327]/90 p-7 lg:sticky lg:top-[120px]">
          <h2 className="t-h3">Récapitulatif</h2>
          <ul className="mt-5 divide-y divide-white/10">
            {lines.map((l) => {
              const p = getProduct(l.productId)!;
              return (
                <li key={`${l.productId}-${l.size ?? ""}`} className="flex items-center gap-4 py-4">
                  <span className="relative block aspect-[3/4] w-14 shrink-0 overflow-hidden rounded-[8px] bg-[#e9ebee]">
                    <Image src={p.images[0]} alt="" fill sizes="56px" className="object-cover object-top" />
                  </span>
                  <span className="min-w-0 flex-1 font-body text-[13.5px] leading-snug text-white">
                    {p.name}
                    <span className="mt-0.5 block text-[12px] text-mist">{l.size ? `Taille ${l.size} · ` : ""}Quantité {l.qty}</span>
                  </span>
                  <span className="font-body text-[13.5px] tabular-nums text-white">{formatPrice(p.priceCents * l.qty)}</span>
                </li>
              );
            })}
          </ul>
          <dl className="mt-4 space-y-3 border-t border-white/10 pt-5 font-body text-[14px]">
            <div className="flex justify-between text-mist"><dt>Sous-total</dt><dd className="tabular-nums text-white">{formatPrice(totals.subtotalCents)}</dd></div>
            <div className="flex justify-between text-mist"><dt>Livraison</dt><dd className="tabular-nums text-white">{ship === 0 ? "Offerte" : formatPrice(ship)}</dd></div>
            <div className="flex justify-between border-t border-white/10 pt-4 text-[17px] font-medium text-white"><dt>Total TTC</dt><dd className="tabular-nums">{formatPrice(total)}</dd></div>
          </dl>
          <Link href="/panier" className="mt-6 block text-center font-body text-[13px] text-white/75 underline decoration-white/25 underline-offset-4 hover:decoration-white">Modifier mon panier</Link>
        </aside>
      </div>
    </main>
  );
}
