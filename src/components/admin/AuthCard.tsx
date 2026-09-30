import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";

export function AuthCard({ title, subtitle, backToSite, children }: { title: string; subtitle?: string; backToSite?: boolean; children: ReactNode }) {
  return (
    <main className="relative grid min-h-svh place-items-center overflow-hidden px-4 py-12">
      <div aria-hidden className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgba(26,52,112,0.55),transparent_70%)]" />
      <div className="w-full max-w-[420px]">
        {backToSite && (
          <Link href="/" className="group mb-6 inline-flex min-h-11 items-center gap-2.5 font-body text-[13px] font-semibold uppercase tracking-[0.06em] text-white/70 transition-colors hover:text-white">
            <ArrowLeft aria-hidden className="size-4 transition-transform duration-300 group-hover:-translate-x-1" />
            Retour au site
          </Link>
        )}
        <div className="mb-8 flex flex-col items-center text-center">
          <Image src="/logos/dames-du-parc-logo.webp" alt="Les Dames du Parc" width={72} height={72} priority className="size-[72px] rounded-full" />
          <h1 className="mt-5 font-display text-[30px] font-semibold uppercase leading-none tracking-[0.08em] text-white">{title}</h1>
          {subtitle && <p className="mt-3 font-body text-[14px] text-mist">{subtitle}</p>}
        </div>
        <div className="rounded-[14px] border border-white/[0.1] bg-night-900/90 p-6 shadow-2xl md:p-8">{children}</div>
        <p className="mt-6 text-center font-body text-[12px] text-white/40">Accès réservé à l&rsquo;équipe. Les connexions sont journalisées.</p>
      </div>
    </main>
  );
}
