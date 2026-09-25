"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { forgotAction, loginAction, mfaAction, resetAction, type FormState } from "@/app/admin/connexion/actions";
import { btn, inp, lbl } from "./ui";
import { cn } from "@/lib/cn";

const initial: FormState = {};

function Feedback({ state }: { state: FormState }) {
  if (state.error) return <p role="alert" className="rounded-[8px] border border-psg-red/40 bg-psg-red/10 px-3 py-2.5 font-body text-[13px] text-[#ff9aa8]">{state.error}</p>;
  if (state.ok) return <p role="status" className="rounded-[8px] border border-emerald-400/30 bg-emerald-400/10 px-3 py-2.5 font-body text-[13px] text-emerald-200">{state.ok}</p>;
  return null;
}

function Password({ name, label, autoComplete }: { name: string; label: string; autoComplete: string }) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label htmlFor={name} className={lbl}>{label}</label>
      <div className="relative mt-1.5">
        <input id={name} name={name} type={show ? "text" : "password"} required autoComplete={autoComplete} className={cn(inp, "h-11 pr-11")} />
        <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? "Masquer le mot de passe" : "Afficher le mot de passe"} className="absolute inset-y-0 right-0 grid w-11 place-items-center text-white/60 hover:text-white">
          {show ? <EyeOff aria-hidden className="size-4" /> : <Eye aria-hidden className="size-4" />}
        </button>
      </div>
    </div>
  );
}

export function LoginForm({ reinit }: { reinit?: boolean }) {
  const [state, action, pending] = useActionState(loginAction, initial);
  return (
    <form action={action} className="space-y-5">
      {reinit && <p role="status" className="rounded-[8px] border border-emerald-400/30 bg-emerald-400/10 px-3 py-2.5 font-body text-[13px] text-emerald-200">Mot de passe mis à jour. Vous pouvez vous connecter.</p>}
      <div>
        <label htmlFor="email" className={lbl}>Adresse e-mail</label>
        <input id="email" name="email" type="email" required autoComplete="username" className={cn(inp, "mt-1.5 h-11")} />
      </div>
      <Password name="password" label="Mot de passe" autoComplete="current-password" />
      <Feedback state={state} />
      <button type="submit" disabled={pending} className={cn(btn.primary, "h-11 w-full")}>{pending ? "Connexion…" : "Se connecter"}</button>
      <p className="text-center font-body text-[13px]"><Link href="/admin/mot-de-passe-oublie" className="text-mist underline decoration-white/25 underline-offset-4 hover:text-white">Mot de passe oublié ?</Link></p>
    </form>
  );
}

export function MfaForm() {
  const [state, action, pending] = useActionState(mfaAction, initial);
  return (
    <form action={action} className="space-y-5">
      <div>
        <label htmlFor="code" className={lbl}>Code à 6 chiffres</label>
        <input id="code" name="code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9 ]{6,7}" required autoFocus className={cn(inp, "mt-1.5 h-12 text-center text-[20px] tracking-[0.5em]")} />
      </div>
      <Feedback state={state} />
      <button type="submit" disabled={pending} className={cn(btn.primary, "h-11 w-full")}>{pending ? "Vérification…" : "Valider"}</button>
    </form>
  );
}

export function ForgotForm() {
  const [state, action, pending] = useActionState(forgotAction, initial);
  return (
    <form action={action} className="space-y-5">
      <div>
        <label htmlFor="email" className={lbl}>Adresse e-mail</label>
        <input id="email" name="email" type="email" required autoComplete="username" className={cn(inp, "mt-1.5 h-11")} />
      </div>
      <Feedback state={state} />
      <button type="submit" disabled={pending} className={cn(btn.primary, "h-11 w-full")}>{pending ? "Envoi…" : "Demander un lien"}</button>
      <p className="text-center font-body text-[13px]"><Link href="/admin/connexion" className="text-mist underline decoration-white/25 underline-offset-4 hover:text-white">Retour à la connexion</Link></p>
    </form>
  );
}

export function ResetForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState(resetAction.bind(null, token), initial);
  return (
    <form action={action} className="space-y-5">
      <Password name="password" label="Nouveau mot de passe" autoComplete="new-password" />
      <Password name="confirm" label="Confirmer le mot de passe" autoComplete="new-password" />
      <p className="font-body text-[12px] text-mist">10 caractères minimum, avec des lettres et des chiffres.</p>
      <Feedback state={state} />
      <button type="submit" disabled={pending} className={cn(btn.primary, "h-11 w-full")}>{pending ? "…" : "Enregistrer"}</button>
    </form>
  );
}
