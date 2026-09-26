import type { Metadata } from "next";
import { wrap } from "@/components/histoire/styles";
import { ForgotForm } from "./ForgotForm";

export const metadata: Metadata = { title: "Mot de passe oublié", robots: { index: false } };

export default function ForgotPage() {
  return (
    <main className="pb-28 pt-[120px] md:pt-[200px]">
      <div className={`${wrap} max-w-[520px]`}>
        <p className="t-eyebrow">Espace membre</p>
        <h1 className="mt-4 break-words t-h1">Mot de passe</h1>
        <p className="mt-6 text-white/75 t-small">Indiquez l&rsquo;adresse e-mail de votre adhésion : nous vous envoyons un lien pour définir ou réinitialiser votre mot de passe. C&rsquo;est aussi la marche à suivre pour une première connexion quand l&rsquo;équipe a créé votre compte.</p>
        <ForgotForm />
      </div>
    </main>
  );
}
