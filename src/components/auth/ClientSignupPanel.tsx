"use client";

import Link from "next/link";
import { useId, useState, type FormEvent } from "react";
import { UserPlus } from "lucide-react";
import { cn } from "@/lib/cn";
import { useAuth } from "./AuthProvider";
import { PasswordInput } from "@/components/ui/PasswordInput";

const field =
  "mt-2 block h-12 w-full rounded-[10px] border border-white/[0.12] bg-[#0d1220] px-4 font-body text-[15px] text-white placeholder:text-white/35 transition-colors focus:border-white/40 focus:outline-none";
const labelCls = "font-body text-[12.5px] font-medium text-white/80";

/** Création d'un compte client (sans adhésion) pour réserver une place aux événements ouverts à toutes. */
export function ClientSignupPanel({ onSuccess, className }: { onSuccess?: () => void; className?: string }) {
  const { refresh } = useAuth();
  const uid = useId();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setErrors({});
    const f = new FormData(e.currentTarget);
    const body = {
      firstName: f.get("firstName"),
      lastName: f.get("lastName"),
      email: f.get("email"),
      phone: f.get("phone"),
      password: f.get("password"),
      consents: { privacy: f.get("privacy") === "on", image: false },
    };
    try {
      const res = await fetch("/api/members/client", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const out = (await res.json().catch(() => ({}))) as { error?: string; errors?: Record<string, string> };
      if (!res.ok) {
        setErrors(out.errors ?? {});
        setError(out.error ?? "Création du compte impossible.");
        return;
      }
      await refresh();
      onSuccess?.();
    } catch {
      setError("Création du compte impossible. Vérifiez votre réseau.");
    } finally {
      setBusy(false);
    }
  }

  const err = (k: string) => (errors[k] ? <p id={`${uid}-${k}-err`} className="mt-1.5 font-body text-[12.5px] text-[#ff8b9b]">{errors[k]}</p> : null);
  const aria = (k: string) => ({ "aria-invalid": Boolean(errors[k]), "aria-describedby": errors[k] ? `${uid}-${k}-err` : undefined });
  return (
    <div className={cn("rounded-[16px] border border-white/[0.1] bg-[#0b1327]/90 p-6 md:p-8", className)}>
      <form onSubmit={submit} noValidate className="space-y-5">
        <p className="text-mist t-small">Pas besoin d&rsquo;être adhérente pour réserver une place : un compte suffit. Il vous permet de payer, de recevoir votre billet et de le retrouver à tout moment.</p>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor={`${uid}-fn`} className={labelCls}>Prénom</label>
            <input id={`${uid}-fn`} name="firstName" required autoComplete="given-name" className={field} {...aria("firstName")} />
            {err("firstName")}
          </div>
          <div>
            <label htmlFor={`${uid}-ln`} className={labelCls}>Nom</label>
            <input id={`${uid}-ln`} name="lastName" required autoComplete="family-name" className={field} {...aria("lastName")} />
            {err("lastName")}
          </div>
        </div>
        <div>
          <label htmlFor={`${uid}-em`} className={labelCls}>E-mail</label>
          <input id={`${uid}-em`} name="email" type="email" required autoComplete="email" placeholder="prenom@exemple.fr" className={field} {...aria("email")} />
          {err("email")}
        </div>
        <div>
          <label htmlFor={`${uid}-ph`} className={labelCls}>Téléphone</label>
          <input id={`${uid}-ph`} name="phone" type="tel" required autoComplete="tel" placeholder="06 12 34 56 78" className={field} {...aria("phone")} />
          {err("phone")}
        </div>
        <div>
          <label htmlFor={`${uid}-pw`} className={labelCls}>Mot de passe</label>
          <PasswordInput id={`${uid}-pw`} name="password" required autoComplete="new-password" className={field} {...aria("password")} />
          <p className="mt-1.5 font-body text-[12px] text-mist">10 caractères minimum, avec des lettres et des chiffres.</p>
          {err("password")}
        </div>
        <label className="flex items-start gap-3 font-body text-[13.5px] leading-[1.6] text-white/85">
          <input type="checkbox" name="privacy" required className="mt-1 size-4 shrink-0 accent-[#d90f2c]" {...aria("privacy")} />
          <span>J&rsquo;accepte que mes données soient traitées par Les Dames du Parc pour gérer mon compte et mes réservations, selon la <Link href="/politique-de-confidentialite" target="_blank" rel="noopener" className="underline underline-offset-4 hover:text-white">politique de confidentialité</Link>.</span>
        </label>
        {err("privacy")}
        {error && <p role="alert" className="rounded-[10px] border border-psg-red/40 bg-psg-red/10 px-4 py-3 font-body text-[13.5px] text-[#ff9aa8]">{error}</p>}
        <button type="submit" disabled={busy} className="inline-flex h-[52px] w-full items-center justify-center gap-3 rounded-[10px] border border-[#ff6b80]/45 bg-[linear-gradient(180deg,#e51b36_0%,#b30d27_100%)] font-body text-[15px] font-medium text-white transition-[filter,transform] hover:brightness-110 disabled:opacity-60">
          <UserPlus aria-hidden className="size-[18px]" strokeWidth={1.8} />
          {busy ? "Création…" : "Créer mon compte"}
        </button>
      </form>
    </div>
  );
}
