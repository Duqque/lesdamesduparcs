"use client";

import { useSyncExternalStore } from "react";

/** Fenêtre de contact (ordinateur) : état partagé entre le lien « Contact », l'icône courrier et le pied de page. */
let open = false;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export const setContactOpen = (v: boolean) => {
  open = v;
  emit();
};
export const openContact = () => setContactOpen(true);
/** Un second clic sur l'icône (ou le lien) qui a ouvert la fenêtre la referme. */
export const toggleContact = () => setContactOpen(!open);

export const useContactOpen = () =>
  useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => open,
    () => false,
  );
