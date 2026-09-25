"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { User as UserIcon } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { MemberPanel } from "@/components/member/MemberPanel";
import { memberMenu } from "@/data/members";
import { cn } from "@/lib/cn";

/** Icône de profil : l'espace membre n'apparaît qu'au clic sur cette icône. */
export function AccountMenu({ buttonClassName }: { buttonClassName: string }) {
  const [open, setOpen] = useState(false);
  const { session } = useAuth();
  const signedIn = session.status === "member" || session.status === "admin";
  const wrap = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (!wrap.current?.contains(t) && !panel.current?.contains(t)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={wrap} className="relative">
      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls="account-panel"
        aria-label={signedIn ? "Mon compte" : "Espace membre"}
        onClick={() => setOpen((v) => !v)}
        className={cn(buttonClassName, open && "border-white/40 bg-[#1b1e23] text-white")}
      >
        <UserIcon aria-hidden className="size-[19px]" strokeWidth={1.7} />
        {signedIn && <span aria-hidden className="absolute right-[7px] top-[7px] size-[6px] rounded-full bg-psg-red-bright" />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            ref={panel}
            id="account-panel"
            role="dialog"
            aria-label="Espace membre"
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="fixed right-3 top-[80px] z-[60] w-[min(360px,calc(100vw-24px))] origin-top-right lg:right-[var(--gutter)] lg:top-[88px]"
          >
            <MemberPanel menu={memberMenu} onNavigate={() => setOpen(false)} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
