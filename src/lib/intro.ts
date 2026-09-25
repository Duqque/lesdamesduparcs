import { useSyncExternalStore } from "react";
import { INTRO_STORAGE_KEY as KEY } from "./intro-key";
let done = false;
const listeners = new Set<() => void>();

export function hasSeenIntro() {
  try {
    return sessionStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

export function finishIntro() {
  if (done) return;
  done = true;
  try {
    sessionStorage.setItem(KEY, "1");
  } catch {}
  listeners.forEach((l) => l());
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

/** true dès que le loader d'entrée se termine (ou est ignoré). */
export const useIntroDone = () =>
  useSyncExternalStore(
    subscribe,
    () => done,
    () => false,
  );
