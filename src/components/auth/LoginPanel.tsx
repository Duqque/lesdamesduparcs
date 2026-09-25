"use client";

import Link from "next/link";
import { useId, useState, type FormEvent } from "react";
import { IdCard, LogIn, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/cn";
import { useAuth } from "./AuthProvider";

type Role = "member" | "admin";

const field =
  "mt-2 block h-12 w-full rounded-[10px] border border-white/[0.12] bg-[#0d1220] px-4 font-body text-[15px] text-white placeholder:text-white/35 transition-colors focus:border-white/40 focus:outline-none";
const labelCls = "font-body text-[12.5px] font-medium text-white/80";

/** Connexion Membre (numéro de carte + e-mail) ou Administrateur (e-mail + mot de passe). */
export function LoginPanel({ onSuccess, defaultRole = "member", className }: { onSuccess?: () => void; defaultRole?: Role; className?: string }) {
  const { refresh } = useAuth();
  const [role, setRole] = useState<Role>(defaultRole);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const uid = useId();

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const data = Object.fromEntries(new FormData(e.currentTarget));
    try {
      const res = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ role, ...data }) });
      const out = (await res.json()) as { error?: string };
      if (!res.ok) setError(out.error ?? "Connexion impossible.");
      else {
        await refresh();
        onSuccess?.();
      }
    } catch {
      setError("Connexion impossible. Vérifiez votre réseau.");
    } finally {
      setBusy(false);
    }
  }

  const tabs: { id: Role; label: string; icon: typeof IdCard }[] = [
    { id: "member", label: "Membre", icon: IdCard },
    { id: "admin", label: "Administrateur", icon: ShieldCheck },
  ];

  return (
    <div className={cn("rounded-[16px] border border-white/[0.1] bg-[#0b1327]/90 p-6 md:p-8", className)}>
      <div role="tablist" aria-label="Type de connexion" className="grid grid-cols-2 gap-1.5 rounded-[12px] bg-black/30 p-1.5">
        {tabs.map((t) => (
          <button
            key={t.id}
            role="tab"
            type="button"
            id={`${uid}-tab-${t.id}`}
            aria-selected={role === t.id}
            aria-controls={`${uid}-panel`}
            onClick={() => {
              setRole(t.id);
              setError("");
            }}
            className={cn(
              "flex min-h-11 items-center justify-center gap-2 rounded-[9px] font-body text-[14px] font-medium transition-colors",
              role === t.id ? "bg-white text-night-950" : "text-white/70 hover:text-white",
            )}
          >
            <t.icon aria-hidden className="size-4" strokeWidth={1.8} />
            {t.label}
          </button>
        ))}
      </div>

      <form id={`${uid}-panel`} role="tabpanel" aria-labelledby={`${uid}-tab-${role}`} onSubmit={submit} className="mt-7 space-y-5" key={role}>
        {role === "member" ? (
          <>
            <p className="font-body text-[14px] leading-[1.7] text-mist">Connectez-vous avec le numéro figurant au verso de votre carte membre.</p>
            <div>
              <label htmlFor={`${uid}-num`} className={labelCls}>Numéro de carte</label>
              <input id={`${uid}-num`} name="memberNumber" required autoComplete="off" placeholder="DDP-0000-0000" className={field} />
            </div>
            <div>
              <label htmlFor={`${uid}-mail`} className={labelCls}>Adresse e-mail</label>
              <input id={`${uid}-mail`} name="email" type="email" required autoComplete="email" placeholder="prenom@exemple.fr" className={field} />
            </div>
          </>
        ) : (
          <>
            <p className="font-body text-[14px] leading-[1.7] text-mist">Espace réservé à l&rsquo;équipe organisatrice : suivi des inscriptions et des paiements.</p>
            <div>
              <label htmlFor={`${uid}-amail`} className={labelCls}>Adresse e-mail</label>
              <input id={`${uid}-amail`} name="email" type="email" required autoComplete="username" className={field} />
            </div>
            <div>
              <label htmlFor={`${uid}-pwd`} className={labelCls}>Mot de passe</label>
              <input id={`${uid}-pwd`} name="password" type="password" required autoComplete="current-password" className={field} />
            </div>
          </>
        )}

        {error && (
          <p role="alert" className="rounded-[10px] border border-psg-red/40 bg-psg-red/10 px-4 py-3 font-body text-[13.5px] text-[#ff9aa8]">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="inline-flex h-[52px] w-full items-center justify-center gap-3 rounded-[10px] border border-[#ff6b80]/45 bg-[linear-gradient(180deg,#e51b36_0%,#b30d27_100%)] font-body text-[15px] font-medium text-white transition-[filter,transform] hover:brightness-110 disabled:opacity-60"
        >
          <LogIn aria-hidden className="size-[18px]" strokeWidth={1.8} />
          {busy ? "Connexion…" : "Se connecter"}
        </button>

        {role === "member" && (
          <p className="text-center font-body text-[13.5px] text-mist">
            Pas encore de carte ?{" "}
            <Link href="/rejoindre-le-groupe" className="font-medium text-white underline decoration-white/30 underline-offset-4 hover:decoration-white">
              Rejoindre le groupe
            </Link>
          </p>
        )}
      </form>
    </div>
  );
}
