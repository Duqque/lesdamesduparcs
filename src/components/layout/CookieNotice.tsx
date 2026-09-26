"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { X } from "lucide-react";

const KEY = "ddp-cookie-notice";

/** Avis d'information (pas de bandeau de consentement : le site ne dépose aucun cookie de mesure d'audience ni de publicité). */
export function CookieNotice() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (localStorage.getItem(KEY) !== "1") setOpen(true);
    } catch {
      setOpen(true);
    }
  }, []);
  if (!open) return null;
  const close = () => {
    setOpen(false);
    try {
      localStorage.setItem(KEY, "1");
    } catch {}
  };
  return (
    <aside
      role="region"
      aria-label="Information sur les cookies"
      className="fixed inset-x-3 bottom-[92px] z-40 mx-auto flex max-w-[420px] items-start gap-4 rounded-[22px] border border-white/[0.12] bg-[#050608]/97 p-5 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.95)] lg:inset-x-auto lg:bottom-6 lg:left-6 lg:mx-0"
    >
      <p className="min-w-0 flex-1 break-words font-body text-[15px] font-light leading-[1.5] text-white/90">
        Ce site ne dépose aucun cookie de mesure d&rsquo;audience ni de publicité.{" "}
        <Link href="/mes-donnees" className="font-medium text-white underline decoration-psg-red-bright decoration-2 underline-offset-[6px]">
          Vos données
        </Link>
      </p>
      <button type="button" onClick={close} aria-label="Fermer l'information" className="grid size-11 shrink-0 place-items-center rounded-full border border-white/[0.16] text-white transition-colors hover:border-white/40 hover:bg-white/5">
        <X aria-hidden className="size-5" strokeWidth={1.7} />
      </button>
    </aside>
  );
}
