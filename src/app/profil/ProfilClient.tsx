"use client";

import Link from "next/link";
import { LogOut } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { Button } from "@/components/ui/Button";

export function ProfilClient() {
  const { session, logout } = useAuth();
  return (
    <main className="mx-auto flex min-h-[80svh] max-w-[720px] flex-col justify-center px-[var(--gutter)] pb-32 pt-[200px] md:pt-[250px]">
      <p className="font-body text-[12px] font-semibold uppercase tracking-[0.3em] text-psg-red-bright">Espace personnel</p>
      <h1 className="mt-4 font-display text-[clamp(38px,5vw,64px)] font-semibold uppercase leading-none tracking-[0.06em] text-white">Mon profil</h1>

      {session.status === "loading" && <p className="mt-8 font-body text-mist">Chargement…</p>}

      {session.status === "anon" && (
        <>
          <p className="mt-6 max-w-md font-body text-[15.5px] leading-[1.8] text-mist">Vous n&rsquo;êtes pas connectée. Connectez-vous avec votre carte membre pour retrouver votre espace.</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button size="lg" href="/connexion">Se connecter</Button>
            <Button size="lg" variant="outline" href="/rejoindre-le-groupe" arrow={false}>Rejoindre le groupe</Button>
          </div>
        </>
      )}

      {(session.status === "member" || session.status === "admin") && (
        <>
          <dl className="mt-10 divide-y divide-white/10 border-y border-white/10 font-body">
            <div className="flex justify-between gap-6 py-5">
              <dt className="text-[13px] uppercase tracking-[0.2em] text-mist">Nom</dt>
              <dd className="text-[15px] text-white">{session.firstName} {session.lastName}</dd>
            </div>
            <div className="flex justify-between gap-6 py-5">
              <dt className="text-[13px] uppercase tracking-[0.2em] text-mist">E-mail</dt>
              <dd className="text-[15px] text-white">{session.email}</dd>
            </div>
            <div className="flex justify-between gap-6 py-5">
              <dt className="text-[13px] uppercase tracking-[0.2em] text-mist">{session.status === "admin" ? "Rôle" : "Carte membre"}</dt>
              <dd className="text-[15px] tabular-nums text-white">{session.status === "admin" ? "Administrateur" : session.memberNumber}</dd>
            </div>
          </dl>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Button size="lg" href="/evenements">Voir les événements</Button>
            <button type="button" onClick={logout} className="inline-flex h-[54px] items-center justify-center gap-3 rounded-[10px] border border-white/[0.12] bg-[#121417]/90 px-7 font-body text-[15.5px] font-medium text-white hover:border-white/30">
              <LogOut aria-hidden className="size-5" strokeWidth={1.7} /> Se déconnecter
            </button>
          </div>
          <p className="mt-8 font-body text-[13.5px] text-mist">
            <Link href="/rejoindre-le-groupe" className="underline decoration-white/30 underline-offset-4 hover:decoration-white">Voir ma carte membre</Link>
          </p>
        </>
      )}
    </main>
  );
}
