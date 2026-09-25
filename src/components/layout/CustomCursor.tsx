"use client";

import { useEffect, useRef, useState } from "react";

type State = "default" | "link" | "button" | "view";

/** Anneau discret qui suit la souris ; le curseur natif reste visible. */
export function CustomCursor() {
  const ref = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<State>("default");

  useEffect(() => {
    const ok = window.matchMedia("(hover: hover) and (pointer: fine)").matches && !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!ok) return;
    const ring = ref.current;
    if (!ring) return;
    let raf = 0;
    let tx = 0;
    let ty = 0;
    let cx = 0;
    let cy = 0;

    const loop = () => {
      cx += (tx - cx) * 0.22;
      cy += (ty - cy) * 0.22;
      ring.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
      raf = requestAnimationFrame(loop);
    };

    const onMove = (e: PointerEvent) => {
      if (ring.dataset.visible !== "true") {
        cx = tx = e.clientX;
        cy = ty = e.clientY;
        ring.dataset.visible = "true";
      }
      tx = e.clientX;
      ty = e.clientY;
      const target = (e.target as Element | null)?.closest<HTMLElement>("button, [role='slider'], input, a, [data-cursor]");
      let next: State = "default";
      if (target) {
        if (target.matches("button, [role='slider'], input")) next = "button";
        else if (target.matches("a")) next = "link";
        else if (target.dataset.cursor === "view") next = "view";
      }
      setState((prev) => (prev === next ? prev : next));
    };
    const onLeave = () => {
      ring.dataset.visible = "false";
    };

    raf = requestAnimationFrame(loop);
    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <div ref={ref} aria-hidden className="cursor-ring" data-state={state} data-visible="false">
      {state === "view" ? "VIEW" : null}
    </div>
  );
}
