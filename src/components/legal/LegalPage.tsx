import Link from "next/link";
import type { ReactNode } from "react";
import { LEGAL_UPDATED } from "@/lib/legal-info";
import { wrap } from "@/components/histoire/styles";

export const legalLinks = [
  { href: "/contact", label: "Contact" },
  { href: "/mentions-legales", label: "Mentions légales" },
  { href: "/reglement", label: "Règlement" },
  { href: "/conditions-generales-de-vente", label: "CGV" },
  { href: "/politique-de-confidentialite", label: "Confidentialité" },
  { href: "/politique-de-cookies", label: "Cookies" },
  { href: "/mes-donnees", label: "Mes données" },
] as const;

export interface Section {
  id: string;
  title: string;
  body: ReactNode;
}

export const P = ({ children }: { children: ReactNode }) => <p className="break-words text-white/80 t-small">{children}</p>;
export const Ul = ({ children }: { children: ReactNode }) => <ul className="ml-5 list-disc space-y-1.5 break-words text-white/80 t-small marker:text-psg-red-bright">{children}</ul>;
export const A = ({ href, children }: { href: string; children: ReactNode }) => (
  <Link href={href} className="text-white underline decoration-psg-red-bright/70 underline-offset-4 hover:decoration-psg-red-bright">{children}</Link>
);

/** Gabarit commun des pages légales : titre, sommaire et sections numérotées. */
export function LegalPage({ eyebrow, title, intro, sections }: { eyebrow: string; title: string; intro?: ReactNode; sections: Section[] }) {
  return (
    <main className="overflow-x-clip pb-28 pt-[120px] md:pt-[200px]">
      <div className={wrap}>
        <p className="t-eyebrow">{eyebrow}</p>
        <h1 className="mt-4 max-w-[22ch] break-words t-h1">{title}</h1>
        <p className="mt-5 text-mist t-caption">Dernière mise à jour : {LEGAL_UPDATED}</p>
        {intro && <div className="mt-8 max-w-3xl space-y-4">{intro}</div>}
        <div className="mt-14 grid gap-12 lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-20">
          <nav aria-label="Sommaire" className="lg:sticky lg:top-[120px] lg:self-start">
            <p className="mb-3 font-body text-[12px] font-semibold uppercase tracking-[0.2em] text-mist">Sommaire</p>
            <ol className="space-y-1.5 font-body text-[14px]">
              {sections.map((s, i) => (
                <li key={s.id}>
                  <a href={`#${s.id}`} className="flex gap-3 py-1 text-white/70 transition-colors hover:text-white">
                    <span className="tabular-nums text-psg-red-bright">{String(i + 1).padStart(2, "0")}</span>
                    <span className="min-w-0 break-words">{s.title}</span>
                  </a>
                </li>
              ))}
            </ol>
            <ul className="mt-8 flex flex-wrap gap-x-4 gap-y-2 border-t border-white/10 pt-5 font-body text-[13px] text-mist">
              {legalLinks.map((l) => <li key={l.href}><Link href={l.href} className="hover:text-white">{l.label}</Link></li>)}
            </ul>
          </nav>
          <div className="min-w-0 space-y-12">
            {sections.map((s, i) => (
              <section key={s.id} id={s.id} aria-labelledby={`${s.id}-t`} className="scroll-mt-32 space-y-4">
                <h2 id={`${s.id}-t`} className="flex items-baseline gap-4 break-words t-h3">
                  <span className="tabular-nums text-psg-red-bright">{String(i + 1).padStart(2, "0")}</span>
                  {s.title}
                </h2>
                {s.body}
              </section>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
