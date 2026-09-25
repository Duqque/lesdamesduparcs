"use client";

import { useEffect, useState, type FormEvent } from "react";
import { CheckCircle2, Lock } from "lucide-react";
import { Check, Field, inputCls, textareaCls } from "@/components/ui/form";
import { formatEuros, validateRegistration, type RegistrationInput, type RegistrationStatus } from "@/lib/registration";
import type { ClubEvent } from "@/types";

interface Props {
  event: ClubEvent;
  member: { firstName: string; lastName: string; email: string; memberNumber: string };
}

interface StatusData {
  capacity: number;
  remaining: number;
  paymentEnabled: boolean;
  mine: { id: string; status: RegistrationStatus; places: number; amountCents: number } | null;
}

const statusLabel: Record<RegistrationStatus, string> = { confirmed: "Inscription confirmée", awaiting_payment: "En attente de paiement", paid: "Inscription confirmée et payée" };

function Section({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <fieldset className="border-t border-white/10 pt-8">
      <legend className="flex items-center gap-3 pr-4 font-body text-[16px] font-medium text-white">
        <span className="grid size-7 place-items-center rounded-full border border-white/25 font-body text-[12px] tabular-nums text-white/80">{n}</span>
        {title}
      </legend>
      <div className="mt-6 grid gap-5 sm:grid-cols-2">{children}</div>
    </fieldset>
  );
}

export function RegistrationForm({ event, member }: Props) {
  const cfg = event.registration;
  const [status, setStatus] = useState<StatusData | null>(null);
  const [v, setV] = useState({
    firstName: member.firstName,
    lastName: member.lastName,
    email: member.email,
    phone: "",
    places: 1,
    birthDate: "",
    guardianName: "",
    guardianPhone: "",
    guardianEmail: "",
    guardianConsent: false,
    emergencyName: "",
    emergencyPhone: "",
    allergies: "",
    comment: "",
    rules: false,
    privacy: false,
    image: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<{ status: RegistrationStatus; message?: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/events/${event.id}/register`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d: StatusData) => !cancelled && setStatus(d))
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [event.id]);

  const set = <K extends keyof typeof v>(k: K, value: (typeof v)[K]) => setV((s) => ({ ...s, [k]: value }));
  const places = cfg.singlePlace ? 1 : v.places;
  const total = cfg.priceCents * places;

  const toInput = (): RegistrationInput => ({
    firstName: v.firstName,
    lastName: v.lastName,
    email: v.email,
    phone: v.phone,
    places,
    birthDate: cfg.guardianRequired ? v.birthDate : undefined,
    guardian: cfg.guardianRequired ? { name: v.guardianName, phone: v.guardianPhone, email: v.guardianEmail, consent: v.guardianConsent } : undefined,
    emergency: { name: v.emergencyName, phone: v.emergencyPhone },
    allergies: v.allergies,
    comment: v.comment,
    consents: { rules: v.rules, privacy: v.privacy, image: v.image },
  });

  const map = (e: Record<string, string>) => ({ ...e });

  async function submit(ev: FormEvent) {
    ev.preventDefault();
    setFormError("");
    const remaining = status?.remaining ?? cfg.capacity;
    const local = validateRegistration(toInput(), event, remaining);
    setErrors(map(local));
    if (Object.keys(local).length) {
      setFormError("Certains champs sont à corriger.");
      document.getElementById("inscription-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/events/${event.id}/register`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(toInput()) });
      const out = (await res.json()) as { error?: string; errors?: Record<string, string>; checkoutUrl?: string; message?: string; registration?: { status: RegistrationStatus } };
      if (!res.ok) {
        setErrors(out.errors ?? {});
        setFormError(out.error ?? "Inscription impossible.");
        return;
      }
      if (out.checkoutUrl) {
        window.location.href = out.checkoutUrl;
        return;
      }
      setDone({ status: out.registration?.status ?? "confirmed", message: out.message });
    } catch {
      setFormError("Inscription impossible. Vérifiez votre réseau.");
    } finally {
      setBusy(false);
    }
  }

  async function resumePayment() {
    setBusy(true);
    try {
      const res = await fetch(`/api/events/${event.id}/checkout`, { method: "POST" });
      const out = (await res.json()) as { checkoutUrl?: string; error?: string };
      if (out.checkoutUrl) window.location.href = out.checkoutUrl;
      else setFormError(out.error ?? "Paiement indisponible.");
    } finally {
      setBusy(false);
    }
  }

  if (done || status?.mine) {
    const mine = status?.mine;
    const st = done?.status ?? mine!.status;
    return (
      <div className="rounded-[16px] border border-white/[0.1] bg-[#0b1327]/90 p-7 md:p-9">
        <p className="flex items-center gap-3 font-body text-[17px] font-medium text-white">
          <CheckCircle2 aria-hidden className="size-6 text-psg-red-bright" strokeWidth={1.7} />
          {statusLabel[st]}
        </p>
        <p className="mt-4 text-mist t-small">
          {done?.message ?? `Votre inscription à « ${event.title} » est enregistrée sous le numéro de carte ${member.memberNumber}. Un rappel vous sera envoyé avant l'événement.`}
        </p>
        {mine?.status === "awaiting_payment" && status?.paymentEnabled && (
          <button type="button" onClick={resumePayment} disabled={busy} className="mt-6 inline-flex h-12 items-center rounded-[10px] border border-[#ff6b80]/45 bg-[linear-gradient(180deg,#e51b36,#b30d27)] px-6 font-body text-[14.5px] font-medium text-white disabled:opacity-60">
            Payer {formatEuros(mine.amountCents)}
          </button>
        )}
        {formError && <p role="alert" className="mt-4 text-[13px] text-[#ff8b9b]">{formError}</p>}
      </div>
    );
  }

  const full = status ? status.remaining <= 0 : false;
  const err = (k: string) => errors[k];
  const ia = (k: string) => ({ "aria-invalid": Boolean(errors[k]), "aria-describedby": errors[k] ? `f-${k}-err` : undefined });

  return (
    <form id="inscription-form" onSubmit={submit} noValidate className="space-y-9 rounded-[16px] border border-white/[0.1] bg-[#0b1327]/90 p-6 md:p-9">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="font-body text-[14px] text-mist">
          Carte membre <span className="font-medium tabular-nums text-white">{member.memberNumber}</span> vérifiée
        </p>
        {status && (
          <p className="rounded-full border border-white/15 px-3.5 py-1.5 font-body text-[12px] text-white/80">
            {full ? "Complet" : `${status.remaining} place${status.remaining > 1 ? "s" : ""} restante${status.remaining > 1 ? "s" : ""}`}
          </p>
        )}
      </div>

      <Section n={1} title={cfg.guardianRequired ? "La participante" : "Vos informations"}>
        <Field id="f-firstName" label="Prénom" error={err("firstName")}>
          <input id="f-firstName" value={v.firstName} onChange={(e) => set("firstName", e.target.value)} autoComplete="given-name" className={inputCls} {...ia("firstName")} />
        </Field>
        <Field id="f-lastName" label="Nom" error={err("lastName")}>
          <input id="f-lastName" value={v.lastName} onChange={(e) => set("lastName", e.target.value)} autoComplete="family-name" className={inputCls} {...ia("lastName")} />
        </Field>
        <Field id="f-email" label="Adresse e-mail" error={err("email")}>
          <input id="f-email" type="email" value={v.email} onChange={(e) => set("email", e.target.value)} autoComplete="email" className={inputCls} {...ia("email")} />
        </Field>
        <Field id="f-phone" label="Téléphone" error={err("phone")}>
          <input id="f-phone" type="tel" value={v.phone} onChange={(e) => set("phone", e.target.value)} autoComplete="tel" placeholder="06 00 00 00 00" className={inputCls} {...ia("phone")} />
        </Field>
        {cfg.guardianRequired && (
          <Field id="f-birthDate" label="Date de naissance" hint={`Réservé aux ${cfg.minAge} à ${cfg.maxAge} ans (âge le jour de l'événement).`} error={err("birthDate")}>
            <input id="f-birthDate" type="date" value={v.birthDate} onChange={(e) => set("birthDate", e.target.value)} autoComplete="bday" className={inputCls} {...ia("birthDate")} />
          </Field>
        )}
        {!cfg.singlePlace && (
          <Field id="f-places" label="Nombre de places" hint="Vous pouvez inscrire jusqu'à 3 invitées en plus de vous." error={err("places")}>
            <select id="f-places" value={v.places} onChange={(e) => set("places", Number(e.target.value))} className={inputCls} {...ia("places")}>
              {[1, 2, 3, 4].map((n) => (
                <option key={n} value={n}>
                  {n} place{n > 1 ? "s" : ""}
                </option>
              ))}
            </select>
          </Field>
        )}
      </Section>

      {cfg.guardianRequired && (
        <Section n={2} title="Responsable légal">
          <Field id="f-guardianName" label="Nom et prénom" error={err("guardianName")}>
            <input id="f-guardianName" value={v.guardianName} onChange={(e) => set("guardianName", e.target.value)} className={inputCls} {...ia("guardianName")} />
          </Field>
          <Field id="f-guardianPhone" label="Téléphone" error={err("guardianPhone")}>
            <input id="f-guardianPhone" type="tel" value={v.guardianPhone} onChange={(e) => set("guardianPhone", e.target.value)} className={inputCls} {...ia("guardianPhone")} />
          </Field>
          <Field id="f-guardianEmail" label="Adresse e-mail" error={err("guardianEmail")} className="sm:col-span-2">
            <input id="f-guardianEmail" type="email" value={v.guardianEmail} onChange={(e) => set("guardianEmail", e.target.value)} className={inputCls} {...ia("guardianEmail")} />
          </Field>
          <div className="sm:col-span-2">
            <Check id="f-guardianConsent" checked={v.guardianConsent} onChange={(c) => set("guardianConsent", c)} error={err("guardianConsent")}>
              J&rsquo;autorise ma fille à participer à la journée, y compris à l&rsquo;initiation au judo et au déplacement en navette jusqu&rsquo;au Parc des Princes.
            </Check>
          </div>
        </Section>
      )}

      <Section n={cfg.guardianRequired ? 3 : 2} title="Santé et contact d'urgence">
        <Field id="f-emergencyName" label="Personne à prévenir" error={err("emergencyName")}>
          <input id="f-emergencyName" value={v.emergencyName} onChange={(e) => set("emergencyName", e.target.value)} className={inputCls} {...ia("emergencyName")} />
        </Field>
        <Field id="f-emergencyPhone" label="Téléphone d'urgence" error={err("emergencyPhone")}>
          <input id="f-emergencyPhone" type="tel" value={v.emergencyPhone} onChange={(e) => set("emergencyPhone", e.target.value)} className={inputCls} {...ia("emergencyPhone")} />
        </Field>
        <Field id="f-allergies" label="Allergies, régime ou besoins particuliers" hint="Facultatif. Ces informations ne sont utilisées que pour l'organisation de l'événement." className="sm:col-span-2">
          <textarea id="f-allergies" value={v.allergies} onChange={(e) => set("allergies", e.target.value)} maxLength={500} className={textareaCls} />
        </Field>
        <Field id="f-comment" label="Un message pour l'équipe ?" className="sm:col-span-2">
          <textarea id="f-comment" value={v.comment} onChange={(e) => set("comment", e.target.value)} maxLength={500} className={textareaCls} />
        </Field>
      </Section>

      <fieldset className="space-y-4 border-t border-white/10 pt-8">
        <legend className="pr-4 font-body text-[16px] font-medium text-white">Engagements</legend>
        <Check id="f-rules" checked={v.rules} onChange={(c) => set("rules", c)} error={err("rules")}>
          J&rsquo;ai lu et j&rsquo;accepte le règlement de l&rsquo;événement et de l&rsquo;association.
        </Check>
        <Check id="f-privacy" checked={v.privacy} onChange={(c) => set("privacy", c)} error={err("privacy")}>
          J&rsquo;accepte que mes données soient traitées par Les Dames du Parc pour gérer mon inscription.
        </Check>
        <Check id="f-image" checked={v.image} onChange={(c) => set("image", c)}>
          J&rsquo;autorise la prise et la diffusion de photos de l&rsquo;événement (facultatif).
        </Check>
      </fieldset>

      <fieldset className="border-t border-white/10 pt-8">
        <legend className="pr-4 font-body text-[16px] font-medium text-white">Paiement</legend>
        {total === 0 ? (
          <p className="mt-5 font-body text-[14.5px] text-mist">Cet événement est gratuit pour les membres : aucun paiement n&rsquo;est demandé.</p>
        ) : (
          <div className="mt-5 rounded-[12px] border border-white/10 bg-black/20 p-5">
            <dl className="space-y-2 font-body text-[14.5px]">
              <div className="flex justify-between text-mist">
                <dt>
                  {places} place{places > 1 ? "s" : ""} × {formatEuros(cfg.priceCents)}
                </dt>
                <dd className="tabular-nums text-white/90">{formatEuros(total)}</dd>
              </div>
              <div className="flex justify-between border-t border-white/10 pt-3 text-[16px] font-medium text-white">
                <dt>Total</dt>
                <dd className="tabular-nums">{formatEuros(total)}</dd>
              </div>
            </dl>
            <p className="mt-4 flex items-start gap-2.5 text-mist t-caption">
              <Lock aria-hidden className="mt-0.5 size-3.5 shrink-0" />
              Paiement sécurisé par Stripe (carte bancaire, Apple Pay, Google Pay). Vous serez redirigée vers la page de paiement : aucun numéro de carte n&rsquo;est saisi ni conservé sur ce site.
              {status && !status.paymentEnabled && " Le paiement en ligne n'est pas encore activé : votre inscription sera enregistrée en attente de règlement."}
            </p>
          </div>
        )}
      </fieldset>

      {formError && (
        <p role="alert" className="rounded-[10px] border border-psg-red/40 bg-psg-red/10 px-4 py-3 font-body text-[13.5px] text-[#ff9aa8]">
          {formError}
        </p>
      )}

      <button
        type="submit"
        disabled={busy || full}
        className="inline-flex h-[54px] w-full items-center justify-center rounded-[10px] border border-[#ff6b80]/45 bg-[linear-gradient(180deg,#e51b36_0%,#b30d27_100%)] font-body text-[15.5px] font-medium text-white transition-[filter] hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {full ? "Événement complet" : busy ? "Envoi en cours…" : total > 0 ? `Confirmer et payer ${formatEuros(total)}` : "Confirmer mon inscription"}
      </button>
    </form>
  );
}
