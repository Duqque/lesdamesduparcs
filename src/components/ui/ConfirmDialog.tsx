"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle } from "lucide-react";

/**
 * Fenêtre de confirmation aux couleurs du site (à la place de la boîte native du navigateur, qui n'est jamais utilisée).
 * Se ferme avec « Annuler », la touche Échap ou un clic à l'extérieur ; le focus est placé sur le bouton de validation.
 */
export function ConfirmDialog({ message, confirmLabel = "Confirmer", cancelLabel = "Annuler", danger = true, onConfirm, onCancel }: { message: string; confirmLabel?: string; cancelLabel?: string; danger?: boolean; onConfirm: () => void; onCancel: () => void }) {
  const ok = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    ok.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
      if (e.key === "Tab") {
        // Le focus reste dans la fenêtre.
        const btns = [...document.querySelectorAll<HTMLButtonElement>("[data-confirm-dialog] button")];
        if (!btns.length) return;
        const i = btns.indexOf(document.activeElement as HTMLButtonElement);
        e.preventDefault();
        btns[(i + (e.shiftKey ? -1 : 1) + btns.length) % btns.length].focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onCancel]);

  return createPortal(
    <div className="fixed inset-0 z-[300] grid place-items-center bg-[#02040c]/80 px-4 backdrop-blur-sm" onMouseDown={(e) => e.target === e.currentTarget && onCancel()}>
      <div data-confirm-dialog role="alertdialog" aria-modal="true" aria-label="Confirmation" className="w-full max-w-[440px] rounded-[16px] border border-white/15 bg-[#0b1327] p-6 shadow-[0_40px_90px_-30px_rgba(0,0,0,0.95)]">
        <div className="flex items-start gap-4">
          <span aria-hidden className={`grid size-11 shrink-0 place-items-center rounded-full border ${danger ? "border-psg-red-bright/50 bg-psg-red/15 text-[#ff8b9b]" : "border-white/20 text-white"}`}>
            <AlertTriangle className="size-5" strokeWidth={1.7} />
          </span>
          <div className="min-w-0">
            <p className="font-display text-[15px] uppercase tracking-[0.04em] text-white">Confirmation</p>
            <p className="mt-2 font-body text-[14.5px] leading-[1.6] text-white/85">{message}</p>
          </div>
        </div>
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button type="button" onClick={onCancel} className="min-h-11 rounded-[10px] border border-white/20 px-5 font-body text-[14px] font-medium text-white hover:border-white/45">{cancelLabel}</button>
          <button ref={ok} type="button" onClick={onConfirm} className="min-h-11 rounded-[10px] border border-[#ff6b80]/45 bg-[linear-gradient(180deg,#e51b36_0%,#b30d27_100%)] px-5 font-body text-[14px] font-medium text-white hover:brightness-110">{confirmLabel}</button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
