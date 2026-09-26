import Image from "next/image";
import { IdCard } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { DEFAULT_CTA } from "@/lib/hero";

/** Carte rouge d'appel à adhérer : photo d'un groupe de supportrices, textes et photo modifiables (Administration › Site internet › Accueil). */
export function JoinCtaCard({ image, alt, title, text, button }: { image?: string; alt?: string; title?: string; text?: string; button?: string }) {
  const src = image || DEFAULT_CTA.image;
  return (
    <section aria-label="Adhérer aux Dames du Parc" className="mx-auto w-full max-w-[1300px] px-[var(--gutter)] pb-8 pt-2 md:pt-6">
      <Reveal>
        <article className="relative isolate grid overflow-hidden rounded-[14px] bg-[linear-gradient(135deg,#e51b36_0%,#c1102b_45%,#8f0a1f_100%)] shadow-[0_40px_90px_-40px_rgba(217,15,44,0.8)] md:min-h-[400px] md:grid-cols-[1.05fr_0.95fr]">
          <div className="order-2 flex flex-col justify-center gap-6 p-7 text-white sm:p-10 md:order-1 md:p-14">
            <p className="font-body text-[12px] font-semibold uppercase tracking-[0.3em] text-white/80">Rejoindre le groupe</p>
            <h2 className="break-words font-display text-[clamp(26px,3.4vw,46px)] uppercase leading-[1.06] text-white">{title || DEFAULT_CTA.title}</h2>
            <p className="max-w-[46ch] font-body text-[16px] leading-[1.7] text-white/90">{text || DEFAULT_CTA.text}</p>
            <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-center">
              <Button size="lg" href="/rejoindre-le-groupe/inscription" icon={IdCard} arrow={false} className="!border-white !bg-white !bg-none !text-[#b30d27] shadow-[0_18px_40px_-18px_rgba(0,0,0,0.6)] hover:!brightness-95">
                {button || DEFAULT_CTA.button}
              </Button>
              <a href="/groupe" className="inline-flex min-h-11 items-center px-2 font-body text-[14.5px] font-medium text-white underline decoration-white/60 decoration-2 underline-offset-[6px] hover:decoration-white">Découvrir le groupe</a>
            </div>
          </div>
          <div className="relative order-1 aspect-[16/10] md:order-2 md:aspect-auto">
            <Image src={src} alt={alt || DEFAULT_CTA.alt} fill sizes="(min-width: 768px) 46vw, 100vw" unoptimized={src.startsWith("/medias/") || src.startsWith("http")} className="object-cover object-[50%_35%]" />
            {/* Photo fondue dans le rouge de la carte */}
            <div aria-hidden className="absolute inset-0 bg-[linear-gradient(180deg,rgba(143,10,31,0.05)_50%,rgba(143,10,31,0.85)_100%)] md:bg-[linear-gradient(90deg,rgba(193,16,43,0.95)_0%,rgba(193,16,43,0.35)_28%,rgba(143,10,31,0.05)_60%)]" />
          </div>
        </article>
      </Reveal>
    </section>
  );
}
