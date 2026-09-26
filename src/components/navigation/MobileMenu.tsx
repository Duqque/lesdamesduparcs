"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, IdCard } from "lucide-react";
import { joinLink, socialLinks } from "@/data/navigation";
import type { NavItem } from "@/types";
import { socialIcons } from "@/components/icons/BrandIcons";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { JoinGate, JoinSectionGate } from "@/components/member/JoinGate";

interface Props {
  open: boolean;
  pathname: string;
  items: readonly NavItem[];
  onNavigate: () => void;
}

export function MobileMenu({ open, pathname, items, onNavigate }: Props) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          id="mobile-menu"
          role="dialog"
          aria-label="Menu"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-40 flex flex-col overflow-y-auto bg-night-950/97 px-[var(--gutter)] pb-[132px] pt-[56px] backdrop-blur-xl lg:hidden"
        >
          <nav aria-label="Navigation mobile" className="flex flex-col">
            {items.map((item, i) => {
              const active = pathname.startsWith(item.href);
              return (
                <motion.div
                  key={item.href}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 + i * 0.05, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                >
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex min-h-16 items-center justify-between border-b border-white/10 font-display text-[26px] uppercase",
                      active ? "text-white" : "text-white/70",
                    )}
                  >
                    {item.label}
                    {active && <span aria-hidden className="h-[3px] w-8 bg-psg-red" />}
                  </Link>
                  {item.children && (
                    <details className="group border-b border-white/10">
                      <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between font-body text-[14px] font-medium text-white/70 [&::-webkit-details-marker]:hidden">
                        Les chapitres du groupe
                        <ChevronDown aria-hidden className="size-4 transition-transform duration-300 group-open:rotate-180" />
                      </summary>
                      <ul className="grid gap-1 pb-4">
                        {item.children.map((c) => (
                          <li key={c.href}>
                            <Link
                              href={c.href}
                              onClick={onNavigate}
                              aria-current={pathname === c.href ? "page" : undefined}
                              className={cn("flex min-h-11 items-center gap-3 break-words border-l-2 pl-4 font-body text-[15px]", pathname === c.href ? "border-psg-red-bright text-white" : "border-white/10 text-white/70")}
                            >
                              {c.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </details>
                  )}
                </motion.div>
              );
            })}
          </nav>
          <JoinSectionGate>
            <div className="mt-10">
              <JoinGate>
                <Button href={joinLink.href} size="lg" icon={IdCard} arrow={false} className="w-full" >
                  {joinLink.label}
                </Button>
              </JoinGate>
            </div>
          </JoinSectionGate>
          <ul className="mt-auto flex gap-2 pt-10">
            {socialLinks.map((s) => {
              const Icon = socialIcons[s.id];
              return (
                <li key={s.id}>
                  <a href={s.href} aria-label={s.label} target="_blank" rel="noopener noreferrer" className="grid size-11 place-items-center rounded-[10px] border border-white/[0.12] text-white/85 hover:bg-white/10 hover:text-white">
                    <Icon className="size-5" />
                  </a>
                </li>
              );
            })}
          </ul>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
