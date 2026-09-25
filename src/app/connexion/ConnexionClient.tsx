"use client";

import { useRouter } from "next/navigation";
import { LoginPanel } from "@/components/auth/LoginPanel";
import { useAuth } from "@/components/auth/AuthProvider";

export function ConnexionClient() {
  const router = useRouter();
  const { session } = useAuth();
  return (
    <main className="mx-auto flex min-h-[80svh] max-w-[560px] flex-col justify-center px-[var(--gutter)] pb-32 pt-[200px] md:pt-[250px]">
      <p className="t-eyebrow">Espace personnel</p>
      <h1 className="mt-4 t-h1">Connexion</h1>
      <p className="mt-5 text-mist t-lead">
        {session.status === "member" || session.status === "admin" ? "Vous êtes déjà connectée." : "Accédez à votre espace membre, ou à l'espace administrateur pour l'équipe organisatrice."}
      </p>
      <LoginPanel className="mt-10" onSuccess={() => router.push("/profil")} />
    </main>
  );
}
