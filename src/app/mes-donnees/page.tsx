import type { Metadata } from "next";
import { A, P } from "@/components/legal/LegalPage";
import { wrap } from "@/components/histoire/styles";
import { getLegalContext } from "@/lib/server/legal";
import { PRIVACY_TYPE_LABEL } from "@/lib/server/privacy";
import { MesDonneesClient } from "./MesDonneesClient";

export const metadata: Metadata = { title: "Mes données", description: "Exercez vos droits sur vos données personnelles : accès, rectification, effacement, opposition, portabilité." };

export default async function MesDonneesPage() {
  const { a, v } = await getLegalContext();
  return (
    <main className="overflow-x-clip pb-28 pt-[120px] md:pt-[200px]">
      <div className={`${wrap} max-w-[960px]`}>
        <p className="t-eyebrow">Vos données</p>
        <h1 className="mt-4 break-words t-h1">Mes données</h1>
        <div className="mt-8 max-w-2xl space-y-4">
          <P>Vos données personnelles vous appartiennent. Vous pouvez à tout moment les consulter, les corriger, les récupérer ou demander leur effacement. L&rsquo;association répond dans un délai d&rsquo;un mois maximum. Pour comprendre ce que nous conservons et pourquoi, lisez la <A href="/politique-de-confidentialite">politique de confidentialité</A>.</P>
          <P>Vous pouvez aussi écrire directement à {v(a.email)}.</P>
        </div>
        <MesDonneesClient types={Object.entries(PRIVACY_TYPE_LABEL).map(([value, label]) => ({ value, label }))} />
      </div>
    </main>
  );
}
