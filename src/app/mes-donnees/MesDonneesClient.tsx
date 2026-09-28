"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { Download, Trash2 } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { PasswordInput } from "@/components/ui/PasswordInput";

const field = "mt-1.5 h-12 w-full rounded-[10px] border border-white/[0.14] bg-white/[0.04] px-4 font-body text-[15px] text-white outline-none focus:border-white/40";
const box = "rounded-[10px] border border-line bg-night-900/85 p-6 md:p-8";
const btn = "inline-flex min-h-12 items-center gap-2 rounded-[10px] border border-white/[0.16] px-6 font-body text-[14.5px] font-medium text-white transition-colors hover:border-white/40 disabled:opacity-60";

export function MesDonneesClient({ types }: { types: Array<{ value: string; label: string }> }) {
  const { session, refresh } = useAuth();
  const member = session.status === "member";
  const [state, setState] = useState<{ ok?: boolean; msg?: string; busy?: boolean }>({});
  const [erase, setErase] = useState<{ ok?: boolean; msg?: string; busy?: boolean }>({});

  async function sendRequest(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    setState({ busy: true });
    const res = await fetch("/api/privacy/request", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(Object.fromEntries(f)) });
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    if (res.ok) {
      form.reset();
      setState({ ok: true, msg: "Demande enregistrée. Un e-mail vous a été envoyé : cliquez sur le lien qu'il contient pour confirmer qu'elle émane de vous. Nous vous répondrons dans un délai d'un mois maximum." });
    } else setState({ msg: data.error ?? "Envoi impossible pour le moment." });
  }

  async function eraseAccount(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setErase({ busy: true });
    const res = await fetch("/api/members/erase", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password: f.get("password"), confirm: f.get("confirm") }) });
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    if (res.ok) {
      setErase({ ok: true, msg: "Votre compte et vos données personnelles ont été effacés." });
      await refresh();
    } else setErase({ msg: data.error ?? "Suppression impossible." });
  }

  return (
    <div className="mt-14 grid gap-6">
      {member && (
        <section className={box} aria-labelledby="mon-compte">
          <h2 id="mon-compte" className="t-h3">Mon compte</h2>
          <p className="mt-3 max-w-xl text-white/75 t-small">Vous êtes connectée : vous pouvez récupérer toutes vos données ou supprimer votre compte immédiatement.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a href="/api/members/export" className={btn}><Download aria-hidden className="size-4" /> Télécharger mes données (JSON)</a>
            <Link href="/profil" className={btn}>Modifier mon mot de passe</Link>
          </div>
          <form onSubmit={eraseAccount} className="mt-8 grid max-w-md gap-4 border-t border-white/10 pt-8">
            <h3 className="font-body text-[16px] font-semibold text-white">Supprimer mon compte et mes données</h3>
            <p className="text-white/70 t-small">Cette action est <strong className="text-white">définitive</strong> : votre fiche, votre carte, vos pièces et vos coordonnées sont effacées. Seules les pièces comptables sont conservées sans lien avec vous, comme la loi l&rsquo;impose.</p>
            <label className="text-[13px] text-mist">Mot de passe<PasswordInput name="password" required autoComplete="current-password" className={field} /></label>
            <label className="text-[13px] text-mist">Tapez SUPPRIMER pour confirmer<input name="confirm" required autoComplete="off" className={field} /></label>
            {erase.msg && <p role="status" className={erase.ok ? "text-[14px] text-emerald-300" : "text-[14px] text-psg-red-bright"}>{erase.msg}</p>}
            <div><button type="submit" disabled={erase.busy} className={`${btn} border-psg-red-bright/60 text-psg-red-bright hover:border-psg-red-bright`}><Trash2 aria-hidden className="size-4" /> Supprimer définitivement mon compte</button></div>
          </form>
        </section>
      )}

      <section className={box} aria-labelledby="demande">
        <h2 id="demande" className="t-h3">Faire une demande</h2>
        <p className="mt-3 max-w-xl text-white/75 t-small">Ouvert à toute personne dont l&rsquo;association détient des données (adhérente, participante à un événement, cliente de la boutique). Nous vous envoyons un e-mail pour confirmer votre identité.</p>
        <form onSubmit={sendRequest} className="mt-6 grid gap-4 md:grid-cols-2">
          <label className="text-[13px] text-mist">Nom et prénom<input name="name" required maxLength={120} autoComplete="name" className={field} /></label>
          <label className="text-[13px] text-mist">Adresse e-mail utilisée sur le site<input name="email" type="email" required autoComplete="email" className={field} /></label>
          <label className="text-[13px] text-mist md:col-span-2">Votre demande
            <select name="type" required defaultValue="" className={field}>
              <option value="" disabled>Choisir…</option>
              {types.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </label>
          <label className="text-[13px] text-mist md:col-span-2">Précisions (facultatif)<textarea name="message" rows={4} maxLength={2000} className={`${field} h-auto py-3`} /></label>
          {state.msg && <p role="status" className={`md:col-span-2 ${state.ok ? "text-[14px] text-emerald-300" : "text-[14px] text-psg-red-bright"}`}>{state.msg}</p>}
          <div className="md:col-span-2"><button type="submit" disabled={state.busy} className={btn}>Envoyer ma demande</button></div>
        </form>
      </section>
    </div>
  );
}
