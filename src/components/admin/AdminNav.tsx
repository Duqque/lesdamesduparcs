"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useState } from "react";
import { BarChart3, Calendar, ChevronDown, Gift, Globe, Home, Megaphone, Menu, Newspaper, Settings, Users, Wallet, X } from "lucide-react";
import { cn } from "@/lib/cn";
import type { NavGroup } from "./nav";

const icons = { home: Home, users: Users, calendar: Calendar, wallet: Wallet, globe: Globe, newspaper: Newspaper, gift: Gift, megaphone: Megaphone, chart: BarChart3, settings: Settings };

/** Navigation latérale permanente (bureau) ou tiroir (mobile). Les groupes s'ouvrent selon la page courante. */
export function AdminNav({ groups, roleLabel, name }: { groups: NavGroup[]; roleLabel: string; name: string }) {
  const pathname = usePathname();
  const search = useSearchParams().toString();
  const current = search ? `${pathname}?${search}` : pathname;
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    if (href.includes("?")) return current === href;
    return pathname === href || (pathname.startsWith(`${href}/`) && !groups.some((g) => g.children?.some((c) => c.href !== href && c.href.split("?")[0] === pathname)));
  };
  const groupOpen = (g: NavGroup) => expanded[g.label] ?? Boolean(g.children?.some((c) => isActive(c.href) || pathname.startsWith(c.href.split("?")[0])));

  const nav = (
    <nav aria-label="Administration" className="flex-1 overflow-y-auto px-3 pb-6">
      <ul className="space-y-1">
        {groups.map((g) => {
          const Icon = icons[g.icon];
          if (!g.children) {
            const active = isActive(g.href!);
            return (
              <li key={g.label}>
                <Link href={g.href!} onClick={() => setOpen(false)} aria-current={active ? "page" : undefined} className={cn("flex min-h-10 items-center gap-3 rounded-[8px] px-3 font-body text-[14px] font-medium transition-colors", active ? "bg-psg-red/20 text-white" : "text-white/70 hover:bg-white/[0.05] hover:text-white")}>
                  <Icon aria-hidden className="size-[18px] shrink-0" strokeWidth={1.7} />
                  {g.label}
                </Link>
              </li>
            );
          }
          const isOpen = groupOpen(g);
          return (
            <li key={g.label}>
              <button
                type="button"
                aria-expanded={isOpen}
                onClick={() => setExpanded((e) => ({ ...e, [g.label]: !isOpen }))}
                className="flex min-h-10 w-full items-center gap-3 rounded-[8px] px-3 font-body text-[14px] font-medium text-white/80 transition-colors hover:bg-white/[0.05] hover:text-white"
              >
                <Icon aria-hidden className="size-[18px] shrink-0" strokeWidth={1.7} />
                <span className="flex-1 text-left">{g.label}</span>
                <ChevronDown aria-hidden className={cn("size-4 transition-transform", isOpen && "rotate-180")} />
              </button>
              {isOpen && (
                <ul className="ml-[22px] mt-1 space-y-0.5 border-l border-white/10 pl-3">
                  {g.children.map((c) => {
                    const active = isActive(c.href);
                    return (
                      <li key={c.href}>
                        <Link href={c.href} onClick={() => setOpen(false)} aria-current={active ? "page" : undefined} className={cn("flex min-h-9 items-center rounded-[7px] px-2.5 font-body text-[13.5px] transition-colors", active ? "bg-white/[0.08] text-white" : "text-white/60 hover:text-white")}>
                          {c.label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );

  const head = (
    <div className="px-5 pb-5 pt-6">
      <p className="font-display text-[19px] font-semibold uppercase leading-none tracking-[0.08em] text-white">Les Dames du Parc</p>
      <p className="mt-1.5 font-body text-[11px] font-semibold uppercase tracking-[0.3em] text-psg-red-bright">Administration</p>
    </div>
  );
  const foot = (
    <div className="border-t border-line px-5 py-4">
      <p className="truncate font-body text-[13.5px] font-medium text-white">{name}</p>
      <p className="font-body text-[12px] text-mist">{roleLabel}</p>
    </div>
  );

  return (
    <>
      <button type="button" aria-label="Ouvrir le menu" onClick={() => setOpen(true)} className="grid size-10 place-items-center rounded-[8px] border border-line text-white lg:hidden">
        <Menu aria-hidden className="size-5" />
      </button>
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[264px] flex-col border-r border-line bg-night-950 lg:flex">
        {head}
        {nav}
        {foot}
      </aside>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button type="button" aria-label="Fermer le menu" onClick={() => setOpen(false)} className="absolute inset-0 bg-black/70" />
          <aside className="absolute inset-y-0 left-0 flex w-[min(300px,86vw)] flex-col border-r border-line bg-night-950">
            <button type="button" aria-label="Fermer" onClick={() => setOpen(false)} className="absolute right-3 top-4 grid size-9 place-items-center rounded-[8px] text-white/70 hover:text-white">
              <X aria-hidden className="size-5" />
            </button>
            {head}
            {nav}
            {foot}
          </aside>
        </div>
      )}
    </>
  );
}
