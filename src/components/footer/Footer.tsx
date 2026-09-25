import Image from "next/image";
import Link from "next/link";
import { socialLinks } from "@/data/navigation";
import { FleurDeLisIcon, socialIcons } from "@/components/icons/BrandIcons";
import { Scribble } from "@/components/ui/Scribble";
import { settings } from "@/lib/server/admin-store";

export async function Footer() {
  const { site, association } = await settings.get();
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
          <span aria-hidden className="hidden h-8 w-px bg-white/15 sm:block" />
          <p className="relative font-script text-[26px] font-medium xl:text-[28px] leading-none text-white">
            {site.footerText.replace(/ ([!?:;])/g, "\u00a0$1")}
            <Scribble className="absolute -bottom-2 left-[14%] h-2 w-[62%]" />
          </p>
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
    </footer>
  );
}
