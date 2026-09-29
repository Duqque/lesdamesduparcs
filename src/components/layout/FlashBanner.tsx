"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

const KEY = "ddp-flash-dismissed";

/**
 * Bannière d'information au-dessus de l'en-tête (place restantes d'une campagne d'adhésion, ou message libre publié depuis
 * Administration > Site internet > Bannière flash), sur fond clair — l'inverse du fond du site — pour rester impossible à
 * manquer. Se referme avec la croix (mémorisé par visiteuse, par `id`) ; reparaît si `id` change (nouvelle campagne, nouveau
 * message…), même si le texte affiché change entre-temps (places restantes, mises à jour en direct). `--flash-h` (définie
 * dans layout.tsx) décale l'en-tête et le contenu de sa hauteur.
 */
export function FlashBanner({ message, id }: { message: string; id: string }) {
  // Vrai tant que le contraire n'est pas prouvé (rendu serveur, --flash-h posée à 44px dans <head>) : évite un saut de mise en
  // page pour la grande majorité qui n'a pas encore fermé la bannière ; corrigée dès que possible sinon (voir plus bas).
  const [open, setOpen] = useState(true);
  useEffect(() => {
    let dismissed = false;
    try {
      dismissed = localStorage.getItem(KEY) === id;
    } catch {
      dismissed = false;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOpen(!dismissed);
    document.documentElement.style.setProperty("--flash-h", dismissed ? "0px" : "44px");
  }, [id]);
  if (!open) return null;
  const close = () => {
    setOpen(false);
    document.documentElement.style.setProperty("--flash-h", "0px");
    try {
      localStorage.setItem(KEY, id);
    } catch {}
  };
  return (
    <div role="status" className="fixed inset-x-0 top-0 z-[70] flex h-11 items-center justify-center bg-[#f5efe0] px-[calc(var(--gutter)+44px)]">
      <p className="max-w-[900px] truncate font-body text-[13px] font-medium leading-tight text-[#0a0e1c] sm:text-[14px] sm:whitespace-normal sm:text-center">{message}</p>
      <button type="button" onClick={close} aria-label="Fermer la bannière" className="absolute right-3 grid size-7 shrink-0 place-items-center rounded-full text-[#0a0e1c]/55 transition-colors hover:bg-[#0a0e1c]/10 hover:text-[#0a0e1c]">
        <X aria-hidden className="size-4" strokeWidth={2} />
      </button>
    </div>
  );
}
