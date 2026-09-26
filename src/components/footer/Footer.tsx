import Image from "next/image";
import Link from "next/link";
import { socialLinks } from "@/data/navigation";
import { FleurDeLisIcon, socialIcons } from "@/components/icons/BrandIcons";
import { settings } from "@/lib/server/admin-store";
import { legalLinks } from "@/components/legal/LegalPage";

export async function Footer() {
  const { association } = await settings.get();
  const links = socialLinks.map((l) => ({ ...l, href: (association[l.id as "instagram"] as string) || l.href }));
  return (
    <footer className="border-t border-white/[0.07] bg-night-950">
      <div className="mx-auto flex max-w-[1800px] flex-col items-center gap-10 px-[var(--gutter)] py-16 md:flex-row md:justify-between md:gap-8 xl:h-[150px] xl:py-0">
        <Link href="/" className="flex items-center gap-4 md:w-[260px]" aria-label="Les Dames du Parc, Paris">
          <Image src="/logos/dames-du-parc-logo.webp" alt="" width={56} height={56} className="size-[54px] rounded-full" />
          <span>
            <span className="block font-body text-[13px] font-semibold uppercase tracking-[0.08em] text-white">Les Dames du Parc</span>
            <span className="mt-1 block font-body text-[11px] uppercase tracking-[0.12em] text-mist">Paris</span>
          </span>
        </Link>

        <div className="flex flex-col items-center gap-5 sm:flex-row sm:gap-9">
          <ul className="flex items-center gap-1">
            {links.map((s) => {
              const Icon = socialIcons[s.id];
              return (
                <li key={s.id}>
                  <a
                    href={s.href}
                    aria-label={s.label}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="grid size-11 place-items-center rounded-full text-white/85 transition-[transform,color,background-color] duration-300 hover:-translate-y-0.5 hover:bg-white/10 hover:text-white"
                  >
                    <Icon className="size-[19px]" />
                  </a>
                </li>
              );
            })}
          </ul>
        </div>

        <div aria-hidden className="hidden items-end gap-5 md:flex md:w-[260px] md:justify-end">
          <FleurDeLisIcon className="size-8 text-white/25" />
          <div className="flex items-end gap-[6px]">
            <span className="h-10 w-[5px] bg-psg-blue" />
            <span className="h-14 w-[5px] bg-psg-red" />
            <span className="h-[46px] w-[5px] bg-white" />
          </div>
        </div>
      </div>
      <nav aria-label="Informations légales" className="border-t border-white/[0.07]">
        <ul className="mx-auto flex max-w-[1800px] flex-wrap items-center justify-center gap-x-6 gap-y-1 px-[var(--gutter)] py-5 font-body text-[12.5px] text-mist md:justify-between">
          <li className="w-full text-center md:w-auto md:text-left">© {new Date().getFullYear()} {association.name}</li>
          {legalLinks.map((l) => (
            <li key={l.href}>
              <Link href={l.href} className="inline-flex min-h-11 items-center transition-colors hover:text-white">{l.label}</Link>
            </li>
          ))}
        </ul>
      </nav>
    </footer>
  );
}
