"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { PasswordInput } from "@/components/ui/PasswordInput";

const field = "mt-1.5 h-12 w-full rounded-[10px] border border-white/[0.14] bg-white/[0.04] px-4 font-body text-[15px] text-white outline-none focus:border-white/40";

export function ResetForm({ token }: { token: string }) {
  const [state, setState] = useState<{ done?: boolean; error?: string; busy?: boolean }>({});
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    if (f.get("password") !== f.get("confirm")) return setState({ error: "Les mots de passe ne correspondent pas." });
    setState({ busy: true });
    const res = await fetch("/api/auth/reset", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, password: f.get("password") }) });
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    setState(res.ok ? { done: true } : { error: data.error ?? "Modification impossible." });
  }
  if (state.done)
    return (
      <div className="mt-8 space-y-5">
        <p role="status" className="rounded-[10px] border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 font-body text-[14px] text-emerald-200">Mot de passe enregistré. Vous pouvez vous connecter.</p>
        <Link href="/connexion" className="inline-flex h-12 items-center rounded-[10px] bg-psg-red px-7 font-body text-[15px] font-semibold text-white hover:bg-psg-red-bright">Se connecter</Link>
      </div>
    );
  return (
    <form onSubmit={submit} className="mt-8 grid gap-4 font-body">
      <label className="text-[13px] text-mist">Nouveau mot de passe<PasswordInput name="password" required minLength={10} autoComplete="new-password" className={field} /></label>
      <label className="text-[13px] text-mist">Confirmer<PasswordInput name="confirm" required autoComplete="new-password" className={field} /></label>
      {state.error && <p role="alert" className="text-[14px] text-psg-red-bright">{state.error}</p>}
      <div><button type="submit" disabled={state.busy} className="inline-flex h-12 items-center rounded-[10px] bg-psg-red px-7 text-[15px] font-semibold text-white hover:bg-psg-red-bright disabled:opacity-60">Enregistrer</button></div>
    </form>
  );
}
