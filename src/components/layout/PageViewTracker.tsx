"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/** Mesure d'audience anonyme (sans cookie) : envoie la page vue au serveur. Respecte « Ne pas me suivre ». */
export function PageViewTracker() {
  const pathname = usePathname();
  useEffect(() => {
    if (navigator.doNotTrack === "1") return;
    let sid = "";
    try {
      sid = sessionStorage.getItem("ddp-sid") ?? "";
      if (!sid) {
        sid = Math.random().toString(36).slice(2, 12);
        sessionStorage.setItem("ddp-sid", sid);
      }
    } catch {
      /* stockage indisponible */
    }
    let ref = "";
    try {
      const u = new URL(document.referrer);
      if (u.host !== location.host) ref = u.host;
    } catch {
      /* pas de provenance */
    }
    const body = JSON.stringify({ path: pathname, ref, sid });
    if (!navigator.sendBeacon?.("/api/track", new Blob([body], { type: "application/json" }))) fetch("/api/track", { method: "POST", body, headers: { "Content-Type": "application/json" }, keepalive: true }).catch(() => undefined);
  }, [pathname]);
  return null;
}
