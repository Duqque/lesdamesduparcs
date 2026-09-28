"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { setContactOpen, toggleContact, useContactOpen } from "@/lib/contact-window";
import { ContactForm } from "./ContactForm";

/** Fenêtre de contact en bas à droite de la page : ordinateur uniquement (tablette et mobile ont la page /contact). */
export function ContactWindow({ email }: { email: string }) {
  const open = useContactOpen();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setContactOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  // Clic sur tout lien vers /contact : sur ordinateur (≥ 1024 px) il ouvre la fenêtre (un second clic la referme), sinon la page s'ouvre normalement.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a || a.target === "_blank") return;
      const url = new URL(a.href, window.location.href);
      if (url.origin !== window.location.origin || url.pathname !== "/contact") return;
      if (!window.matchMedia("(min-width: 1024px)").matches) return;
      e.preventDefault();
      e.stopPropagation(); // empêche le routeur de Next de naviguer vers /contact
      toggleContact();
    };
    // Phase de capture : le clic est traité avant celui du composant <Link> de Next.
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  if (!open) return null;
  return (
    <section
      role="dialog"
      aria-label="Nous contacter"
      className="fixed bottom-[76px] right-6 z-[60] hidden max-h-[30svh] w-[30vw] min-w-[300px] max-w-[30vw] overflow-y-auto overscroll-contain rounded-[14px] border border-white/[0.14] bg-[#07090d]/97 p-2 shadow-[0_18px_50px_-18px_rgba(0,0,0,0.95)] lg:block"
    >
      <div className="mb-1 flex items-center justify-between gap-3">
        <h2 className="min-w-0 truncate font-display text-[12.5px] uppercase leading-none text-white">Nous contacter</h2>
        <a href={`mailto:${email}`} className="ml-auto min-w-0 truncate font-body text-[12px] text-white/60 underline underline-offset-2 hover:text-white">{email}</a>
        <button type="button" onClick={() => setContactOpen(false)} aria-label="Fermer la fenêtre de contact" className="grid size-7 shrink-0 place-items-center rounded-full border border-white/[0.16] text-white transition-colors hover:border-white/40 hover:bg-white/5">
          <X aria-hidden className="size-3.5" strokeWidth={1.8} />
        </button>
      </div>
      <ContactForm compact autoFocus />
    </section>
  );
}
