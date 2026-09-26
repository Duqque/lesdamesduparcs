"use client";

import { useState, type FormEvent } from "react";

const field = "mt-1.5 h-12 w-full rounded-[10px] border border-white/[0.14] bg-white/[0.04] px-4 font-body text-[15px] text-white outline-none focus:border-white/40";

export function ForgotForm() {
  const [state, setState] = useState<{ done?: boolean; error?: string; busy?: boolean }>({});
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState({ busy: true });
    const res = await fetch("/api/auth/forgot", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: new FormData(e.currentTarget).get("email") }) });
    setState(res.ok ? { done: true } : { error: "Trop de tentatives ou erreur. Réessayez dans quelques minutes." });
  }
  if (state.done) return <p role="status" className="mt-8 rounded-[10px] border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 font-body text-[14px] text-emerald-200">Si un compte correspond à cette adresse, un e-mail contenant un lien vient de vous être envoyé. Pensez à vérifier vos courriers indésirables.</p>;
  return (
    <form onSubmit={submit} className="mt-8 grid gap-4 font-body">
      <label className="text-[13px] text-mist">Adresse e-mail<input name="email" type="email" required autoComplete="email" className={field} /></label>
      {state.error && <p role="alert" className="text-[14px] text-psg-red-bright">{state.error}</p>}
      <div><button type="submit" disabled={state.busy} className="inline-flex h-12 items-center rounded-[10px] bg-psg-red px-7 text-[15px] font-semibold text-white hover:bg-psg-red-bright disabled:opacity-60">Recevoir le lien</button></div>
    </form>
  );
}
