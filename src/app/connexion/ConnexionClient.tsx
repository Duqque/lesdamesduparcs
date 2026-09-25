"use client";

import { useRouter } from "next/navigation";
import { LoginPanel } from "@/components/auth/LoginPanel";
import { useAuth } from "@/components/auth/AuthProvider";

export function ConnexionClient() {
  const router = useRouter();
  const { session } = useAuth();
  return (
    <main className="mx-auto flex min-h-[80svh] max-w-[560px] flex-col justify-center px-[var(--gutter)] pb-32 pt-[200px] md:pt-[250px]">
      <p className="font-body text-[12px] font-semibold uppercase tracking-[0.3em] text-psg-red-bright">Espace personnel</p>
      <h1 className="mt-4 font-display text-[clamp(38px,5vw,64px)] font-semibold uppercase leading-none tracking-[0.06em] text-white">Connexion</h1>
      <p className="mt-5 font-body text-[15.5px] leading-[1.8] text-mist">
        {session.status === "member" || session.status === "admin" ? "Vous êtes déjà connectée." : "Accédez à votre espace membre, ou à l'espace administrateur pour l'équipe organisatrice."}
      </p>
      <LoginPanel className="mt-10" onSuccess={() => router.push("/profil")} />
    </main>
  );
}
