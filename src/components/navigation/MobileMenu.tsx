"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { mainNav, signature, socialLinks } from "@/data/navigation";
import { socialIcons } from "@/components/icons/BrandIcons";
import { cn } from "@/lib/cn";

interface Props {
  open: boolean;
  pathname: string;
  onNavigate: () => void;
}

export function MobileMenu({ open, pathname, onNavigate }: Props) {
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
          className="fixed inset-0 z-40 flex flex-col overflow-y-auto bg-night-950/97 px-[var(--gutter)] pb-10 pt-[88px] backdrop-blur-xl lg:hidden"
        >
          <nav aria-label="Navigation mobile" className="flex flex-col">
            {mainNav.map((item, i) => {
              const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
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
                      "flex min-h-14 items-center justify-between border-b border-white/10 font-display text-[34px] font-semibold uppercase tracking-[0.04em]",
                      active ? "text-white" : "text-white/75",
                    )}
                  >
                    {item.label}
                    {active && <span aria-hidden className="h-[3px] w-8 bg-psg-red" />}
                  </Link>
                </motion.div>
              );
            })}
          </nav>
          <div className="mt-auto pt-10">
            <p className="mb-5 font-body text-[11px] uppercase tracking-[0.28em] text-mist">{signature.join(" · ")}</p>
            <ul className="flex gap-1">
              {socialLinks.map((s) => {
                const Icon = socialIcons[s.id];
                return (
                  <li key={s.id}>
                    <a href={s.href} aria-label={s.label} target="_blank" rel="noopener noreferrer" className="grid size-11 place-items-center rounded-full text-white/85 hover:bg-white/10 hover:text-white">
                      <Icon className="size-5" />
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
