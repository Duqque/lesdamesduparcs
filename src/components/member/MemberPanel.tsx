import Link from "next/link";
import { ArrowRight, CreditCard, Gift, Ticket, User as UserIcon, Users, type LucideIcon } from "lucide-react";
import { formatYear } from "@/lib/format";
import type { User } from "@/types";

const icons: Record<string, LucideIcon> = { card: CreditCard, tickets: Ticket, benefits: Gift, team: Users };

interface Props {
  user: User;
  menu: ReadonlyArray<{ id: string; label: string; href: string }>;
}

export function MemberPanel({ user, menu }: Props) {
  return (
    <section
      aria-label="Espace membre"
      className="relative overflow-hidden rounded-[6px] md:grid md:grid-cols-[auto_1fr] md:items-center md:gap-x-12 xl:block border border-line bg-night-900/80 px-7 pb-5 pt-8 shadow-[0_24px_60px_-30px_rgba(0,0,0,0.95)] backdrop-blur-md before:absolute before:inset-y-0 before:left-0 before:w-px before:bg-[linear-gradient(180deg,var(--color-psg-red),transparent_55%)]"
    >
      <div className="flex items-center gap-4">
        <span className="grid size-[58px] shrink-0 place-items-center rounded-full border border-white/10 bg-night-700/70 text-white/80">
          <UserIcon aria-hidden className="size-7" strokeWidth={1.4} fill="currentColor" />
        </span>
        <div className="min-w-0">
          <p className="truncate font-body text-[17px] font-semibold text-white">Bonjour {user.profile.firstName}</p>
          <p className="mt-0.5 font-body text-[12px] text-mist">Membre depuis {formatYear(user.membership.joinedAt)}</p>
          <Link
            href="/profil"
            className="group/p mt-2 inline-flex min-h-11 items-center gap-2 rounded-[3px] border border-white/45 px-3.5 font-body text-[11.5px] font-semibold text-white transition-[transform,border-color,background-color] duration-300 hover:-translate-y-0.5 hover:border-white hover:bg-white/10 xl:min-h-[30px]"
          >
            Mon profil
            <ArrowRight aria-hidden className="size-3.5 transition-transform duration-300 group-hover/p:translate-x-1" />
          </Link>
        </div>
      </div>
      <span aria-hidden className="mt-6 block h-[2px] w-7 bg-psg-red md:hidden xl:block" />
      <ul className="mt-3 md:mt-0 md:grid md:grid-cols-2 md:gap-x-8 xl:mt-3 xl:block">
        {menu.map((item) => {
          const Icon = icons[item.id] ?? CreditCard;
          return (
            <li key={item.id}>
              <Link
                href={item.href}
                className="group flex min-h-11 items-center gap-4 xl:min-h-[50px] font-body text-[14px] text-white/90 transition-colors hover:text-white"
              >
                <Icon aria-hidden className="size-[22px] shrink-0 text-white/80 transition-colors group-hover:text-white" strokeWidth={1.5} />
                <span className="flex-1 transition-transform duration-300 group-hover:translate-x-1">{item.label}</span>
                <ArrowRight aria-hidden className="size-3.5 -translate-x-1 opacity-0 transition-[opacity,transform] duration-300 group-hover:translate-x-0 group-hover:opacity-100" />
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
