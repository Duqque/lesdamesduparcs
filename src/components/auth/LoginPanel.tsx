"use client";

import Link from "next/link";
import { useId, useState, type FormEvent } from "react";
import { LogIn } from "lucide-react";
import { cn } from "@/lib/cn";
import { useAuth } from "./AuthProvider";
import { PasswordInput } from "@/components/ui/PasswordInput";

type Role = "member" | "admin";

const field =
  "mt-2 block h-12 w-full rounded-[10px] border border-white/[0.12] bg-[#0d1220] px-4 font-body text-[15px] text-white placeholder:text-white/35 transition-colors focus:border-white/40 focus:outline-none";
const labelCls = "font-body text-[12.5px] font-medium text-white/80";

/** Connexion Membre (e-mail ou numéro de carte + mot de passe) ou Administrateur (e-mail + mot de passe). */
export function LoginPanel({ onSuccess, defaultRole = "member", className }: { onSuccess?: () => void; defaultRole?: Role; className?: string }) {
  const { refresh } = useAuth();
  const [role] = useState<Role>(defaultRole);
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

  return (
    <div className={cn("rounded-[16px] border border-white/[0.1] bg-[#0b1327]/90 p-6 md:p-8", className)}>
      <form id={`${uid}-panel`} onSubmit={submit} className="space-y-5">
        {role === "member" ? (
          <>
            <p className="text-mist t-small">Connectez-vous avec l&rsquo;adresse e-mail (ou le numéro de carte) de votre adhésion.</p>
            <div>
              <label htmlFor={`${uid}-mail`} className={labelCls}>E-mail ou numéro de carte</label>
              <input id={`${uid}-mail`} name="memberNumber" required autoComplete="username" placeholder="prenom@exemple.fr" className={field} />
            </div>
            <div>
              <label htmlFor={`${uid}-mpwd`} className={labelCls}>Mot de passe</label>
              <PasswordInput id={`${uid}-mpwd`} name="password" required autoComplete="current-password" className={field} />
              <p className="mt-2 text-right"><Link href="/connexion/mot-de-passe-oublie" className="font-body text-[13px] text-mist underline underline-offset-4 hover:text-white">Mot de passe oublié ou première connexion ?</Link></p>
            </div>
          </>
        ) : null}

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
            Pas encore membre ?{" "}
            <Link href="/rejoindre-le-groupe/inscription" className="font-medium text-white underline decoration-white/30 underline-offset-4 hover:decoration-white">
              Créer mon compte
            </Link>
          </p>
        )}
        <p className="text-center font-body text-[12.5px] text-mist/80">
          Équipe de l&rsquo;association ?{" "}
          <Link href="/admin/connexion" className="text-white/80 underline decoration-white/25 underline-offset-4 hover:text-white">Espace administration</Link>
        </p>
      </form>
    </div>
  );
}
