"use client";

import Link from "next/link";
import { ArrowRight, CreditCard, Gift, LogIn, Ticket, User as UserIcon, Users, type LucideIcon } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { Button } from "@/components/ui/Button";

const icons: Record<string, LucideIcon> = { card: CreditCard, tickets: Ticket, benefits: Gift, team: Users };

interface Props {
  menu: ReadonlyArray<{ id: string; label: string; href: string }>;
}

/** Espace membre de l'accueil : invite à se connecter tant que le visiteur ne l'est pas. */
export function MemberPanel({ menu }: Props) {
  const { session } = useAuth();
  const shell =
    "relative overflow-hidden rounded-[8px] border border-line bg-night-900/80 px-7 pb-6 pt-8 shadow-[0_24px_60px_-30px_rgba(0,0,0,0.95)] backdrop-blur-md before:absolute before:inset-y-0 before:left-0 before:w-px before:bg-[linear-gradient(180deg,var(--color-psg-red),transparent_55%)]";

  if (session.status === "member" || session.status === "admin") {
    const name = session.firstName;
    return (
      <section aria-label="Espace membre" className={shell}>
        <div className="flex items-center gap-4">
          <span className="grid size-[58px] shrink-0 place-items-center rounded-full border border-white/10 bg-night-700/70 text-white/80">
            <UserIcon aria-hidden className="size-7" strokeWidth={1.4} fill="currentColor" />
          </span>
          <div className="min-w-0">
            <p className="truncate font-body text-[17px] font-semibold text-white">Bonjour {name}</p>
            <p className="mt-0.5 font-body text-[12px] text-mist">{session.status === "admin" ? "Administrateur" : `Carte ${session.memberNumber}`}</p>
            <Link href="/profil" className="group/p mt-2 inline-flex min-h-11 items-center gap-2 rounded-[8px] border border-white/[0.12] bg-[#121417]/90 px-3.5 font-body text-[12.5px] font-medium text-white transition-colors hover:border-white/30 xl:min-h-[34px]">
              Mon profil <ArrowRight aria-hidden className="size-3.5 transition-transform duration-300 group-hover/p:translate-x-1" />
            </Link>
          </div>
        </div>
        <span aria-hidden className="mt-6 block h-[2px] w-7 bg-psg-red" />
        <ul className="mt-3">
          {menu.map((item) => {
            const Icon = icons[item.id] ?? CreditCard;
            return (
              <li key={item.id}>
                <Link href={item.href} className="group flex min-h-11 items-center gap-4 font-body text-[14px] text-white/90 transition-colors hover:text-white xl:min-h-[50px]">
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

  return (
    <section aria-label="Espace membre" className={shell}>
      <span className="grid size-[58px] place-items-center rounded-full border border-white/10 bg-night-700/70 text-white/70">
        <UserIcon aria-hidden className="size-7" strokeWidth={1.4} />
      </span>
      <p className="mt-6 font-body text-[17px] font-semibold text-white">Espace membre</p>
      <p className="mt-2 font-body text-[13.5px] leading-[1.7] text-mist">Connectez-vous avec votre carte pour retrouver vos billets, vos avantages et vos inscriptions.</p>
      <div className="mt-6 flex flex-col gap-3">
        <Button href="/connexion" size="sm" icon={LogIn} arrow={false} className="w-full">
          Se connecter
        </Button>
        <Button href="/rejoindre-le-groupe" size="sm" variant="outline" arrow={false} className="w-full">
          Rejoindre le groupe
        </Button>
      </div>
    </section>
  );
}
