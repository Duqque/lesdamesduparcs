import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { memberFromUnsubscribeToken, setEmailUpdates } from "@/lib/server/unsubscribe";

export const metadata: Metadata = { title: "E-mails de nouveautés", robots: { index: false } };

async function change(formData: FormData) {
  "use server";
  const token = String(formData.get("t") ?? "");
  const on = formData.get("on") === "1";
  const done = await setEmailUpdates(token, on);
  redirect(`/desabonnement?t=${encodeURIComponent(token)}&etat=${done ? (on ? "abonne" : "desabonne") : "erreur"}`);
}

/** Page ouverte depuis le lien des e-mails de nouveautés : rien n'est modifié par la simple ouverture du lien (les messageries le pré-chargent), il faut confirmer. */
export default async function UnsubscribePage({ searchParams }: { searchParams: Promise<{ t?: string; etat?: string }> }) {
  const { t = "", etat } = await searchParams;
  const member = t ? await memberFromUnsubscribeToken(t) : null;
  const subscribed = member ? member.emailUpdates !== false : false;
  return (
    <main className="mx-auto max-w-[640px] px-[var(--gutter)] pb-32 pt-[200px] md:pt-[250px]">
      <p className="t-eyebrow">E-mails de nouveautés</p>
      <h1 className="mt-4 t-h1">{etat === "desabonne" ? "C’est noté" : etat === "abonne" ? "Bon retour" : "Vos e-mails"}</h1>
      {!member ? (
        <p className="mt-6 text-mist t-lead">Ce lien n’est pas valide. Vous pouvez gérer vos e-mails depuis votre <Link href="/profil#emails" className="text-white underline decoration-white/30 underline-offset-4">espace membre</Link>.</p>
      ) : (
        <>
          <p className="mt-6 text-mist t-lead">
            {etat === "desabonne" ? "Vous ne recevrez plus d’e-mail à chaque nouvel article, événement ou produit. Vos messages importants (paiements, rappels d’événements auxquels vous êtes inscrite) continuent d’arriver."
              : subscribed ? `Bonjour ${member.firstName}, vous recevez un e-mail à chaque nouvel article, événement ou produit de la boutique. Souhaitez-vous arrêter ?`
              : `Bonjour ${member.firstName}, vous ne recevez plus d’e-mail de nouveautés. Souhaitez-vous les recevoir de nouveau ?`}
          </p>
          <form action={change} className="mt-8">
            <input type="hidden" name="t" value={t} />
            <input type="hidden" name="on" value={subscribed ? "0" : "1"} />
            <button type="submit" className="inline-flex min-h-[54px] items-center justify-center rounded-[10px] border border-[#ff6b80]/45 bg-[linear-gradient(180deg,#e51b36_0%,#b30d27_100%)] px-7 font-body text-[15.5px] font-medium text-white hover:brightness-110">
              {subscribed ? "Me désabonner" : "Me réabonner"}
            </button>
          </form>
        </>
      )}
    </main>
  );
}
