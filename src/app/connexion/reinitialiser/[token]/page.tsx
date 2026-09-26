import type { Metadata } from "next";
import { wrap } from "@/components/histoire/styles";
import { ResetForm } from "./ResetForm";

export const metadata: Metadata = { title: "Nouveau mot de passe", robots: { index: false } };

export default async function ResetPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return (
    <main className="pb-28 pt-[120px] md:pt-[200px]">
      <div className={`${wrap} max-w-[520px]`}>
        <p className="t-eyebrow">Espace membre</p>
        <h1 className="mt-4 break-words t-h1">Nouveau mot de passe</h1>
        <p className="mt-6 text-white/75 t-small">Choisissez un mot de passe d&rsquo;au moins 10 caractères, avec des lettres et des chiffres.</p>
        <ResetForm token={token} />
      </div>
    </main>
  );
}
