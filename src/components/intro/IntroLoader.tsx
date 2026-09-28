"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Volume2 } from "lucide-react";
import { useChantAudio } from "@/components/chants/AudioProvider";
import { cn } from "@/lib/cn";
import { finishIntro, hasSeenIntro, useIntroDone } from "@/lib/intro";
import type { ParcScene } from "./parcScene";

/** Durées (ms) : chargement 0 → 100 %, palier à 100 %, sortie. */
const DURATION_MS = 8200;
const HOLD_MS = 1400;
const EXIT_MS = 1500;
const LOAD_TIMEOUT_MS = 7000;
/** Filet de sécurité : quoi qu'il arrive, le loader disparaît et le scroll est rendu. */
const MAX_TOTAL_MS = 20000;

const unlockScroll = () => {
  document.documentElement.style.overflow = "";
  document.body.style.overflow = "";
};

const webglAvailable = () => {
  try {
    const c = document.createElement("canvas");
    return Boolean(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
};

/**
 * Entrée dans le Parc : nuit, projecteurs qui s'allument autour du stade, médaille 3D des Dames du Parc.
 * Une seule progression pilote la scène (voir parcScene.ts). Affiché une fois par session ; ignoré si
 * le mouvement est réduit ou si WebGL est indisponible. Aperçu figé : ?introDebug=0.7
 */
export function IntroLoader() {
  const introDone = useIntroDone();
  const { playing } = useChantAudio();
  const [exiting, setExiting] = useState(false);
  const [gone, setGone] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);
  const pctRef = useRef<HTMLSpanElement>(null);
  const skipRef = useRef(false);
  const exitRef = useRef<() => void>(() => {});

  const startExit = useCallback(() => {
    if (skipRef.current) return;
    skipRef.current = true;
    setExiting(true);
    finishIntro();
    unlockScroll();
  }, []);

  useEffect(() => {
    const debug = new URLSearchParams(window.location.search).get("introDebug");
    if (!debug && (hasSeenIntro() || document.referrer.startsWith(window.location.origin) || window.matchMedia("(prefers-reduced-motion: reduce)").matches || !webglAvailable())) {
      finishIntro();
      return;
    }
    document.documentElement.style.overflow = "hidden";
    let scene: ParcScene | null = null;
    let raf = 0;
    let cancelled = false;
    let tStart = 0;
    let tExit = 0;
    let lastPct = -1;
    const clock0 = performance.now();

    const setPct = (v: number) => {
      const n = Math.max(0, Math.min(100, Math.floor(v)));
      if (n !== lastPct && pctRef.current) {
        lastPct = n;
        pctRef.current.textContent = `${String(n).padStart(2, "0")}%`;
      }
    };

    exitRef.current = () => {
      if (!tExit) tExit = performance.now();
    };

    const bail = () => {
      if (cancelled) return;
      skipRef.current = true;
      finishIntro();
      unlockScroll();
      setGone(true);
    };

    const frame = (now: number) => {
      if (!scene) return;
      const time = (now - clock0) / 1000;
      let p: number;
      let hold = 0;
      let exit = 0;
      if (debug) {
        p = Math.min(Math.max(parseFloat(debug) || 0, 0), 1);
        hold = p >= 1 ? 0.5 : 0;
      } else {
        const t = now - tStart;
        p = Math.min(t / DURATION_MS, 1);
        hold = Math.min(Math.max((t - DURATION_MS) / HOLD_MS, 0), 1);
        if (p >= 1 && hold >= 1 && !tExit) startExit();
      }
      if (tExit) exit = Math.min((now - tExit) / EXIT_MS, 1);
      setPct(p * 100 + (p >= 1 ? 1 : 0));
      scene.render(p, hold, exit, time);
      raf = requestAnimationFrame(frame);
    };

    const timeout = window.setTimeout(() => {
      if (!scene) bail();
    }, LOAD_TIMEOUT_MS);
    const failsafe = debug ? 0 : window.setTimeout(bail, MAX_TOTAL_MS);

    import("./parcScene")
      .then(({ createParcScene }) => createParcScene(stageRef.current!, (f) => setPct(f * 4)))
      .then((s) => {
        if (cancelled) {
          s.dispose();
          return;
        }
        window.clearTimeout(timeout);
        scene = s;
        tStart = performance.now();
        s.resize();
        window.addEventListener("resize", s.resize);
        raf = requestAnimationFrame(frame);
      })
      .catch(bail);

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
      window.clearTimeout(failsafe);
      cancelAnimationFrame(raf);
      if (scene) {
        window.removeEventListener("resize", scene.resize);
        scene.dispose();
      }
      unlockScroll();
    };
  }, [startExit]);

  useEffect(() => {
    if (!exiting) return;
    exitRef.current();
    const t = window.setTimeout(() => {
      unlockScroll();
      setGone(true);
    }, EXIT_MS + 100);
    return () => window.clearTimeout(t);
  }, [exiting]);

  if (gone || (introDone && !exiting)) return null;

  return (
    <div className="intro-root" role="status" aria-live="polite" aria-label="Chargement du site">
      <div className={cn("intro-loader fixed inset-0 z-[100] overflow-hidden bg-[#02040c] text-white", exiting && "is-exiting")}>
        <div ref={stageRef} aria-hidden className="absolute inset-0" />

        <div className="pointer-events-none relative z-10 flex h-full flex-col justify-between px-[var(--gutter)] pb-8 pt-6 md:pb-10 md:pt-8">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={startExit}
              className="pointer-events-auto min-h-11 px-2 font-body text-[11px] font-medium uppercase tracking-[0.28em] text-white/55 transition-colors hover:text-white"
            >
              Passer
            </button>
          </div>
          <div className="grid grid-cols-3 items-end">
            <p className={cn("hidden items-center gap-2 font-body text-[10px] lg:flex uppercase tracking-[0.24em] text-white/45 transition-opacity", playing && "opacity-0")}>
              <Volume2 aria-hidden className="size-3.5" />
              <span className="hidden sm:inline">Touchez pour le son</span>
            </p>
            <span ref={pctRef} className="justify-self-center font-display text-[13px] font-medium tabular-nums tracking-[0.42em] text-white/70">
              00%
            </span>
          </div>
        </div>
      </div>
      {exiting && <div aria-hidden className="intro-flash fixed inset-0 z-[101]" />}
    </div>
  );
}
