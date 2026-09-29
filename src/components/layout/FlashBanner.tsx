"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { useReducedMotion } from "framer-motion";

const KEY = "ddp-flash-dismissed";

/**
 * Bannière d'information au-dessus de l'en-tête (place restantes d'une campagne d'adhésion, ou message libre publié depuis
 * Administration > Site internet > Bannière flash) : fond rouge, texte blanc en Special Gothic, défilant façon bandeau
 * d'actualité (deux copies du message dans un même rail, -50% ramène pile sur la seconde : boucle invisible). Se referme
 * avec la croix (mémorisé par visiteuse, par `id`) ; reparaît si `id` change (nouvelle campagne, nouveau message…), même si
 * le texte affiché change entre-temps (places restantes, mises à jour en direct). « Réduire les animations » : texte fixe,
 * centré, une seule copie. `--flash-h` (définie dans layout.tsx) décale l'en-tête et le contenu de sa hauteur.
 */
export function FlashBanner({ message, id }: { message: string; id: string }) {
  const reduce = useReducedMotion();
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
  const item = "font-display shrink-0 whitespace-nowrap px-6 text-[13px] uppercase tracking-[0.04em] text-white sm:text-[14px]";
  return (
    <div role="status" className="fixed inset-x-0 top-0 z-[70] h-11 overflow-hidden bg-psg-red">
      {reduce ? (
        <p className={`${item} flex h-11 items-center justify-center text-center`} style={{ fontFamily: "var(--font-display)" }}>{message}</p>
      ) : (
        <div className="absolute inset-y-0 left-0 right-11 flex items-center overflow-hidden">
          <div className="flash-marquee-track flex shrink-0 items-center" style={{ fontFamily: "var(--font-display)" }}>
            <span className={item}>{message}</span>
            <span className={item} aria-hidden>{message}</span>
          </div>
        </div>
      )}
      <button type="button" onClick={close} aria-label="Fermer la bannière" className="absolute right-3 top-1/2 grid size-7 -translate-y-1/2 shrink-0 place-items-center rounded-full text-white/70 transition-colors hover:bg-white/15 hover:text-white">
        <X aria-hidden className="size-4" strokeWidth={2} />
      </button>
    </div>
  );
}
