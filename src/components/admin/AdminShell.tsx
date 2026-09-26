import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { ExternalLink, Eye, LogOut, UserRound } from "lucide-react";
import { logoutAction } from "@/app/admin/connexion/actions";
import { ROLE_LABELS } from "@/lib/admin/permissions";
import type { AdminContext } from "@/lib/server/admin-auth";
import { AdminNav } from "./AdminNav";
import { CommandPalette } from "./CommandPalette";
import { NotificationBell } from "./NotificationBell";
import { ADMIN_NAV, type NavGroup } from "./nav";

function visibleNav(ctx: AdminContext): NavGroup[] {
  return ADMIN_NAV.map((g) => {
    if (g.perm && !ctx.can(g.perm)) return null;
    if (!g.children) return g;
    const children = g.children.filter((c) => !c.perm || ctx.can(c.perm));
    return children.length ? { ...g, children } : null;
  }).filter((g): g is NavGroup => g !== null);
}

export function AdminShell({ ctx, children }: { ctx: AdminContext; children: ReactNode }) {
  const name = `${ctx.admin.firstName} ${ctx.admin.lastName}`.trim();
  return (
    <div className="min-h-svh">
      <header className="sticky top-0 z-20 flex h-[68px] items-center gap-3 border-b border-line bg-night-950 px-4 lg:ml-[264px] lg:px-8">
        <Suspense fallback={null}>
          <AdminNav groups={visibleNav(ctx)} roleLabel={ROLE_LABELS[ctx.admin.role]} name={name} />
        </Suspense>
        <div className="ml-auto flex items-center gap-2 lg:ml-0 lg:flex-1 lg:justify-end">
          <a
            href="/"
            target="_blank"
            rel="noopener"
            aria-label="Prévisualiser le site (nouvel onglet)"
            className="inline-flex h-10 items-center gap-2 rounded-[8px] border border-line px-3 font-body text-[13px] font-medium text-white/85 hover:border-white/30 hover:text-white"
          >
            <Eye aria-hidden className="size-[18px]" strokeWidth={1.7} />
            <span className="hidden sm:inline">Prévisualiser le site</span>
            <ExternalLink aria-hidden className="hidden size-3.5 opacity-60 sm:block" />
          </a>
          <CommandPalette />
          <NotificationBell />
          <details className="group/acc relative">
            <summary className="grid size-10 cursor-pointer list-none place-items-center rounded-[8px] border border-line text-white/80 hover:border-white/30 hover:text-white [&::-webkit-details-marker]:hidden" aria-label="Mon compte">
              <UserRound aria-hidden className="size-[18px]" strokeWidth={1.7} />
            </summary>
            <div className="absolute right-0 top-12 z-40 w-[240px] overflow-hidden rounded-[12px] border border-white/15 bg-night-900 shadow-2xl">
              <div className="border-b border-line px-4 py-3">
                <p className="truncate font-body text-[13.5px] font-medium text-white">{name}</p>
                <p className="truncate font-body text-[12px] text-mist">{ctx.admin.email}</p>
              </div>
              <Link href="/admin/compte" className="block px-4 py-2.5 font-body text-[13.5px] text-white/85 hover:bg-white/[0.05]">Mon compte et sécurité</Link>
              <Link href="/" className="block px-4 py-2.5 font-body text-[13.5px] text-white/85 hover:bg-white/[0.05]">Prévisualiser le site</Link>
              <form action={logoutAction}>
                <button type="submit" className="flex w-full items-center gap-2 border-t border-line px-4 py-2.5 text-left font-body text-[13.5px] text-[#ff9aa8] hover:bg-white/[0.05]">
                  <LogOut aria-hidden className="size-4" /> Se déconnecter
                </button>
              </form>
            </div>
          </details>
        </div>
      </header>
      <main className="px-4 py-8 lg:ml-[264px] lg:px-8 lg:py-10">
        <div className="mx-auto max-w-[1280px]">{children}</div>
      </main>
    </div>
  );
}
