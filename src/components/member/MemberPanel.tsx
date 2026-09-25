"use client";

import Link from "next/link";
import { ArrowRight, CreditCard, FileText, Gift, LogIn, LogOut, Receipt, User as UserIcon, type LucideIcon } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { Button } from "@/components/ui/Button";

const icons: Record<string, LucideIcon> = { card: CreditCard, attestation: FileText, transactions: Receipt, benefits: Gift };

interface Props {
  menu: ReadonlyArray<{ id: string; label: string; href: string }>;
  onNavigate?: () => void;
}

/** Contenu de l'espace membre, affiché dans la fenêtre ouverte par l'icône de profil du header. */
export function MemberPanel({ menu, onNavigate }: Props) {
  const { session, logout } = useAuth();
  const shell =
    "relative overflow-hidden rounded-[14px] border border-white/[0.12] bg-night-900/95 px-6 pb-6 pt-7 shadow-[0_40px_90px_-30px_rgba(0,0,0,0.95)] backdrop-blur-xl before:absolute before:inset-y-0 before:left-0 before:w-px before:bg-[linear-gradient(180deg,var(--color-psg-red),transparent_55%)]";

  if (session.status === "member" || session.status === "admin") {
    return (
      <section aria-label="Espace membre" className={shell}>
        <div className="flex items-center gap-4">
          <span className="grid size-[54px] shrink-0 place-items-center rounded-full border border-white/10 bg-night-700/70 text-white/80">
            <UserIcon aria-hidden className="size-6" strokeWidth={1.4} fill="currentColor" />
          </span>
          <div className="min-w-0">
            <p className="truncate font-body text-[16px] font-semibold text-white">Bonjour {session.firstName}</p>
            <p className="mt-0.5 font-body text-[12px] text-mist">{session.status === "admin" ? "Administrateur" : `Carte ${session.memberNumber}`}</p>
          </div>
        </div>
        <ul className="mt-5 border-t border-white/10 pt-2">
          {menu.map((item) => {
            const Icon = icons[item.id] ?? CreditCard;
            return (
              <li key={item.id}>
                <Link href={item.href} onClick={onNavigate} className="group flex min-h-12 items-center gap-4 font-body text-[14px] text-white/90 transition-colors hover:text-white">
                  <Icon aria-hidden className="size-5 shrink-0 text-white/75 group-hover:text-white" strokeWidth={1.5} />
                  <span className="flex-1 transition-transform duration-300 group-hover:translate-x-1">{item.label}</span>
                  <ArrowRight aria-hidden className="size-3.5 -translate-x-1 opacity-0 transition-[opacity,transform] duration-300 group-hover:translate-x-0 group-hover:opacity-100" />
                </Link>
              </li>
            );
          })}
        </ul>
        <div className="mt-3 grid grid-cols-2 gap-2.5">
          <Button href="/profil" size="sm" variant="outline" arrow={false}>
            Mon profil
          </Button>
          <button
            type="button"
            onClick={() => {
              void logout();
              onNavigate?.();
            }}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-[10px] border border-white/[0.12] bg-[#121417]/90 font-body text-[14px] font-medium text-white hover:border-white/30"
          >
            <LogOut aria-hidden className="size-4" strokeWidth={1.7} /> Quitter
          </button>
        </div>
      </section>
    );
  }

  return (
    <section aria-label="Espace membre" className={shell}>
      <span className="grid size-[54px] place-items-center rounded-full border border-white/10 bg-night-700/70 text-white/70">
        <UserIcon aria-hidden className="size-6" strokeWidth={1.4} />
      </span>
      <p className="mt-5 font-body text-[17px] font-semibold text-white">Espace membre</p>
      <p className="mt-2 text-mist t-small">Connectez-vous pour retrouver votre carte, votre attestation, vos transactions et vos avantages.</p>
      <div className="mt-6 flex flex-col gap-3">
        <div onClick={onNavigate}>
          <Button href="/connexion" size="sm" icon={LogIn} arrow={false} className="w-full">
            Se connecter
          </Button>
        </div>
        <div onClick={onNavigate}>
          <Button href="/rejoindre-le-groupe/inscription" size="sm" variant="outline" arrow={false} className="w-full">
            Devenir membre
          </Button>
        </div>
      </div>
    </section>
  );
}
