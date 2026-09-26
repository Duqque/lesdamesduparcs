import { createHash } from "node:crypto";
import type { Metadata } from "next";
import { wrap } from "@/components/histoire/styles";
import { A, P } from "@/components/legal/LegalPage";
import { privacyRequests } from "@/lib/server/privacy";
import { confirmPrivacyAction } from "./actions";

export const metadata: Metadata = { title: "Confirmer ma demande", robots: { index: false } };

export default async function ConfirmPage({ params, searchParams }: { params: Promise<{ token: string }>; searchParams: Promise<{ ok?: string }> }) {
  const { token } = await params;
  const { ok } = await searchParams;
  const hash = createHash("sha256").update(token).digest("hex");
  const req = await privacyRequests.findOne((r) => r.tokenHash === hash);
  return (
    <main className="pb-28 pt-[120px] md:pt-[200px]">
      <div className={`${wrap} max-w-[720px]`}>
        <p className="t-eyebrow">Vos données</p>
        <h1 className="mt-4 break-words t-h1">Confirmer ma demande</h1>
        <div className="mt-8 space-y-5">
          {!req ? (
            <P>Ce lien n&rsquo;est plus valable. Vous pouvez refaire une demande depuis la page <A href="/mes-donnees">Mes données</A>.</P>
          ) : req.verified || ok ? (
            <P>Merci, votre demande est confirmée. L&rsquo;association vous répondra dans un délai d&rsquo;un mois maximum.</P>
          ) : (
            <>
              <P>Confirmez que la demande de {req.name} concernant ses données personnelles émane bien de vous.</P>
              <form action={confirmPrivacyAction.bind(null, token)}>
                <button type="submit" className="inline-flex min-h-12 items-center rounded-[10px] bg-psg-red px-7 font-body text-[15px] font-semibold text-white hover:bg-psg-red-bright">Confirmer ma demande</button>
              </form>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
