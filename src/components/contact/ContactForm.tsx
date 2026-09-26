"use client";

import Link from "next/link";
import { useId, useState, type FormEvent } from "react";
import { Send } from "lucide-react";
import { cn } from "@/lib/cn";

const field =
  "mt-1.5 block w-full rounded-[10px] border border-white/[0.14] bg-white/[0.05] px-3.5 font-body text-[15px] text-white placeholder:text-white/35 transition-colors focus:border-white/45 focus:outline-none";

interface State {
  busy?: boolean;
  done?: boolean;
  error?: string;
  errors?: Record<string, string>;
}

/** Formulaire de contact partagé par la fenêtre (ordinateur) et la page /contact (tablette, mobile). */
export function ContactForm({ compact = false, autoFocus = false, onDone }: { compact?: boolean; autoFocus?: boolean; onDone?: () => void }) {
  const uid = useId();
  const [state, setState] = useState<State>({});

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    setState({ busy: true });
    try {
      const res = await fetch("/api/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(Object.fromEntries(new FormData(form))) });
      const data = (await res.json().catch(() => ({}))) as { error?: string; errors?: Record<string, string> };
      if (res.ok) {
        form.reset();
        setState({ done: true });
        onDone?.();
      } else setState({ error: data.error ?? "Envoi impossible pour le moment.", errors: data.errors });
    } catch {
      setState({ error: "Envoi impossible. Vérifiez votre connexion." });
    }
  }

  if (state.done)
    return (
      <div role="status" className={cn("rounded-[10px] border border-emerald-400/30 bg-emerald-400/10 font-body", compact ? "p-3" : "p-5")}>
        <p className={cn("font-medium text-emerald-100", compact ? "text-[13.5px]" : "text-[16px]")}>Message envoyé, merci !</p>
        <p className={cn("mt-1 leading-[1.5] text-emerald-100/80", compact ? "text-[12px]" : "mt-2 text-[14px]")}>Un e-mail de confirmation vient de vous être envoyé. Nous vous répondrons dès que possible.</p>
        <button type="button" onClick={() => setState({})} className={cn("text-white underline underline-offset-4", compact ? "mt-2 text-[12px]" : "mt-4 text-[13.5px]")}>Envoyer un autre message</button>
      </div>
    );

  const err = (k: string) => state.errors?.[k];
  const inp = (k: string) => cn(field, compact ? "h-8 rounded-[8px] px-2.5 text-[13px]" : "h-11", err(k) && "border-psg-red-bright/70");
  const lbl = compact ? "sr-only" : "block text-[12.5px] font-medium text-white/80";
  const wrapCls = compact ? "block" : "block text-[12.5px] font-medium text-white/80";
  const full = !compact ? "sm:col-span-2" : "";
  const ph = (t: string) => (compact ? t : undefined);
  return (
    <form onSubmit={submit} noValidate className={cn("grid font-body", compact ? "grid-cols-2 gap-1.5" : "gap-3.5 sm:grid-cols-2")}>
      <label className={wrapCls} htmlFor={`${uid}-fn`}>
        <span className={compact ? "sr-only" : ""}>Prénom</span>
        <input id={`${uid}-fn`} name="firstName" required autoComplete="given-name" autoFocus={autoFocus} maxLength={80} placeholder={ph("Prénom")} className={inp("firstName")} aria-invalid={Boolean(err("firstName"))} />
        {err("firstName") && <span role="alert" className="mt-0.5 block text-[11px] text-[#ff9aa8]">{err("firstName")}</span>}
      </label>
      <label className={wrapCls} htmlFor={`${uid}-ln`}>
        <span className={compact ? "sr-only" : ""}>Nom</span>
        <input id={`${uid}-ln`} name="lastName" required autoComplete="family-name" maxLength={80} placeholder={ph("Nom")} className={inp("lastName")} aria-invalid={Boolean(err("lastName"))} />
        {err("lastName") && <span role="alert" className="mt-0.5 block text-[11px] text-[#ff9aa8]">{err("lastName")}</span>}
      </label>
      <label className={cn(wrapCls, !compact && full)} htmlFor={`${uid}-em`}>
        <span className={compact ? "sr-only" : ""}>E-mail</span>
        <input id={`${uid}-em`} name="email" type="email" required autoComplete="email" maxLength={160} placeholder={ph("E-mail")} className={inp("email")} aria-invalid={Boolean(err("email"))} />
        {err("email") && <span role="alert" className="mt-0.5 block text-[11px] text-[#ff9aa8]">{err("email")}</span>}
      </label>
      <label className={cn(wrapCls, !compact && full)} htmlFor={`${uid}-ph`}>
        <span className={compact ? "sr-only" : ""}>Téléphone</span>
        <input id={`${uid}-ph`} name="phone" type="tel" required autoComplete="tel" maxLength={24} placeholder={ph("Téléphone")} className={inp("phone")} aria-invalid={Boolean(err("phone"))} />
        {err("phone") && <span role="alert" className="mt-0.5 block text-[11px] text-[#ff9aa8]">{err("phone")}</span>}
      </label>
      <label className={cn(wrapCls, compact ? "col-span-2" : full)} htmlFor={`${uid}-msg`}>
        <span className={compact ? "sr-only" : ""}>Message</span>
        <textarea id={`${uid}-msg`} name="message" required rows={compact ? 2 : 6} maxLength={4000} placeholder={ph("Votre message")} className={cn(field, compact ? "min-h-[44px] resize-none rounded-[8px] px-2.5 py-1.5 text-[13px]" : "py-3", err("message") && "border-psg-red-bright/70")} aria-invalid={Boolean(err("message"))} />
        {err("message") && <span role="alert" className="mt-0.5 block text-[11px] text-[#ff9aa8]">{err("message")}</span>}
      </label>
      {/* Champ piège pour les robots : invisible et hors du parcours au clavier. */}
      <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>Ne pas remplir<input name="website" tabIndex={-1} autoComplete="off" /></label>
      </div>
      {state.error && !state.errors && <p role="alert" className={cn("rounded-[8px] border border-psg-red/40 bg-psg-red/10 px-2.5 py-1.5 text-[12px] text-[#ff9aa8]", compact ? "col-span-2" : full)}>{state.error}</p>}
      <div className={cn("flex items-center gap-2", compact ? "col-span-2" : full)}>
        <button type="submit" disabled={state.busy} className={cn("inline-flex items-center justify-center gap-2 rounded-[8px] border border-[#ff6b80]/45 bg-[linear-gradient(180deg,#e51b36_0%,#b30d27_100%)] font-medium text-white transition-[filter] hover:brightness-110 disabled:opacity-60", compact ? "h-8 shrink-0 px-3.5 text-[12.5px]" : "h-12 w-full text-[15px]")}>
          <Send aria-hidden className={compact ? "size-3.5" : "size-4"} strokeWidth={1.8} />
          {state.busy ? "Envoi…" : "Envoyer"}
        </button>
        <p className={cn("min-w-0 leading-[1.4] text-white/55", compact ? "text-[10.5px]" : "text-[12px]")}>
          Données utilisées uniquement pour vous répondre : <Link href="/politique-de-confidentialite" className="underline underline-offset-2 hover:text-white">confidentialité</Link>.
        </p>
      </div>
    </form>
  );
}
