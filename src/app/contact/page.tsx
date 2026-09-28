import type { Metadata } from "next";
import { Mail } from "lucide-react";
import { wrap } from "@/components/histoire/styles";
import { ContactForm } from "@/components/contact/ContactForm";
import { getCms } from "@/lib/server/cms";
import { getLegalContext } from "@/lib/server/legal";

export const metadata: Metadata = { title: "Contact", description: "Contactez Les Dames du Parc : un message, une question, une proposition. Nous vous répondons rapidement." };

/** Page de contact : utilisée sur tablette et mobile (sur ordinateur, le lien « Contact » ouvre une fenêtre en bas à droite). */
export default async function ContactPage() {
  const [{ a }, cms] = await Promise.all([getLegalContext(), getCms()]);
  const email = a.email || "contact@lesdamesduparc.com";
  return (
    <main className="overflow-x-clip pb-28 pt-[64px] md:pt-[120px] lg:pt-[200px]">
      <div className={`${wrap} max-w-[880px]`}>
        <p className="t-eyebrow">Contact</p>
        <h1 className="mt-4 break-words t-h1">{cms.t("contact.titre", "Nous contacter")}</h1>
        <p className="mt-6 max-w-xl text-white/80 t-lead">{cms.t("contact.intro", "Une question, une proposition, une envie de rejoindre le groupe ? Écrivez-nous : votre message arrive directement dans la boîte de l’association.")}</p>
        <a href={`mailto:${email}`} className="mt-6 inline-flex min-h-11 items-center gap-3 break-all font-body text-[15px] text-white underline decoration-psg-red-bright underline-offset-4">
          <Mail aria-hidden className="size-5 shrink-0" strokeWidth={1.7} /> {email}
        </a>
        <div className="mt-10 rounded-[14px] border border-line bg-night-900/85 p-5 sm:p-8">
          <ContactForm />
        </div>
      </div>
    </main>
  );
}
