import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export function PagePlaceholder({ title, description }: { title: string; description: string }) {
  return (
    <main className="mx-auto flex min-h-[70svh] max-w-[1800px] flex-col justify-center px-[var(--gutter)] pb-24 pt-[230px]">
      <p className="font-body text-[12px] font-semibold uppercase tracking-[0.28em] text-psg-red-bright">Bientôt</p>
      <h1 className="mt-4 font-display text-[clamp(44px,7vw,96px)] font-semibold uppercase leading-none tracking-[0.06em] text-white">{title}</h1>
      <p className="mt-6 max-w-xl font-body text-[16px] leading-relaxed text-mist">{description}</p>
      <Link href="/" className="group mt-10 inline-flex min-h-11 w-fit items-center gap-2.5 font-body text-[13px] font-semibold uppercase tracking-[0.06em] text-white">
        <ArrowLeft aria-hidden className="size-4 transition-transform duration-300 group-hover:-translate-x-1" />
        Retour à l&rsquo;accueil
      </Link>
    </main>
  );
}
