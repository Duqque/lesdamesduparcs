"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { Star, Trophy, Volume2 } from "lucide-react";
import { useChantAudio } from "@/components/chants/AudioProvider";
import { championsLeagueYears, ligue1Years, loaderPhotos, START_YEAR } from "@/data/palmares";
import { cn } from "@/lib/cn";
import { finishIntro, hasSeenIntro, useIntroDone } from "@/lib/intro";

const YEAR_MS = 46;
const L1_HOLD_MS = 380;
const UCL_HOLD_MS = 1600;
const END_HOLD_MS = 500;

const noopSubscribe = () => () => {};
const useCurrentYear = () =>
  useSyncExternalStore(
    noopSubscribe,
    () => new Date().getFullYear(),
    () => 2026,
  );

interface Step {
  year: number;
  arrive: number;
  leave: number;
  progress: number;
  l1: boolean;
  ucl: boolean;
}

function buildTimeline(endYear: number) {
  const span = Math.max(endYear - START_YEAR, 1);
  const steps: Step[] = [];
  let t = 0;
  for (let y = START_YEAR; y <= endYear; y++) {
    const ucl = (championsLeagueYears as readonly number[]).includes(y);
    const l1 = (ligue1Years as readonly number[]).includes(y);
    const hold = ucl ? UCL_HOLD_MS : l1 ? L1_HOLD_MS : 0;
    steps.push({ year: y, arrive: t, leave: t + hold, progress: (y - START_YEAR) / span, l1, ucl });
    t += hold + YEAR_MS;
  }
  return { steps, total: t - YEAR_MS + END_HOLD_MS };
}

const ordinal = (n: number) => (n === 1 ? "1er" : `${n}e`);

export function IntroLoader() {
  const endYear = useCurrentYear();
  const introDone = useIntroDone();
  const { playing } = useChantAudio();
  const timeline = useMemo(() => buildTimeline(endYear), [endYear]);

  const [year, setYear] = useState(START_YEAR);
  const [photo, setPhoto] = useState(0);
  const [exiting, setExiting] = useState(false);
  const [gone, setGone] = useState(false);
  const barRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef(0);

  const current = timeline.steps.find((s) => s.year === year) ?? timeline.steps[0];
  const holding = year === current.year && (current.l1 || current.ucl);
  const [hold, setHold] = useState(false);
  const showEvent = holding && hold;

  const l1Count = (ligue1Years as readonly number[]).filter((y) => y <= year && y <= endYear).length;
  const uclCount = (championsLeagueYears as readonly number[]).filter((y) => y <= year && y <= endYear).length;

  const startExit = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    setExiting(true);
    finishIntro();
  }, []);

  useEffect(() => {
    if (hasSeenIntro() || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      finishIntro();
      return;
    }
    document.documentElement.style.overflow = "hidden";
    const { steps, total } = timeline;
    const t0 = performance.now();
    let idx = 0;
    let lastYear = START_YEAR;
    let lastPhoto = 0;
    let lastHold = false;

    const tick = (now: number) => {
      const t = now - t0;
      while (idx < steps.length - 1 && t >= steps[idx + 1].arrive) idx++;
      const s = steps[idx];
      const next = steps[idx + 1];
      let p = s.progress;
      if (next && t > s.leave) p = s.progress + (next.progress - s.progress) * Math.min((t - s.leave) / YEAR_MS, 1);
      if (barRef.current) barRef.current.style.transform = `scaleX(${p})`;

      if (s.year !== lastYear) {
        lastYear = s.year;
        setYear(s.year);
      }
      const ph = Math.min(loaderPhotos.length - 1, Math.floor(p * loaderPhotos.length));
      if (ph !== lastPhoto) {
        lastPhoto = ph;
        setPhoto(ph);
      }
      const isHold = (s.l1 || s.ucl) && t < s.leave;
      if (isHold !== lastHold) {
        lastHold = isHold;
        setHold(isHold);
      }
      if (t >= total) {
        startExit();
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [timeline, startExit]);

  useEffect(() => {
    if (!exiting) return;
    const t = window.setTimeout(() => {
      document.documentElement.style.overflow = "";
      setGone(true);
    }, 2100);
    return () => window.clearTimeout(t);
  }, [exiting]);

  if (gone || (introDone && !exiting)) return null;

  const ucl = showEvent && current.ucl;
  const l1Only = showEvent && current.l1 && !current.ucl;
  const gold = uclCount > 0;

  return (
    <div className="intro-root" role="status" aria-live="polite" aria-label="Chargement du site">
      <div
        className={cn("intro-loader fixed inset-0 z-[100] overflow-hidden bg-night-950 text-white", exiting && "is-exiting")}
      >
        <div aria-hidden className="absolute inset-0">
          {loaderPhotos.map((src, i) =>
            Math.abs(i - photo) <= 1 ? (
              <Image
                key={src}
                src={src}
                alt=""
                fill
                sizes="100vw"
                priority={i === 0}
                className={cn(
                  "object-cover transition-[opacity,transform] duration-[900ms,4000ms] ease-out",
                  i === photo ? "scale-[1.08] opacity-[0.42]" : "scale-100 opacity-0",
                )}
              />
            ) : null,
          )}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_45%,rgba(3,9,25,0.15)_0%,rgba(3,9,25,0.85)_75%),linear-gradient(180deg,rgba(3,9,25,0.7),rgba(3,9,25,0.35)_40%,rgba(3,9,25,0.9))]" />
        </div>

        {ucl && <div key={`g${year}`} aria-hidden className="intro-gold-flash absolute inset-0" />}
        {l1Only && <div key={`r${year}`} aria-hidden className="intro-red-flash absolute inset-0" />}
        {ucl && <GoldConfetti key={`c${year}`} />}

        <div className="relative z-10 flex h-full flex-col px-[var(--gutter)] pb-8 pt-6 md:pb-12 md:pt-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Image src="/logos/dames-du-parc-logo.webp" alt="" width={44} height={44} priority className="size-11 rounded-full" />
              <span className="hidden font-body text-[12px] font-semibold uppercase tracking-[0.18em] text-white/90 sm:block">Les Dames du Parc</span>
            </div>
            <button
              type="button"
              onClick={startExit}
              className="min-h-11 rounded-full border border-white/30 px-5 font-body text-[11.5px] font-semibold uppercase tracking-[0.14em] text-white/90 transition-colors hover:border-white hover:bg-white/10 hover:text-white"
            >
              Passer
            </button>
          </div>

          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <p className="font-body text-[11px] font-semibold uppercase tracking-[0.34em] text-white/70 md:text-[12px]">Paris depuis {START_YEAR}</p>
            <div
              className={cn(
                "mt-2 font-display text-[clamp(110px,24vw,280px)] font-bold leading-[0.9] tracking-[0.02em] tabular-nums transition-[color,text-shadow] duration-300",
                ucl ? "text-gold" : "text-white",
                l1Only && "[text-shadow:0_0_60px_rgba(240,22,52,0.65)]",
              )}
              aria-label={`Année ${year}`}
            >
              {year}
            </div>

            <div className="mt-3 flex min-h-[86px] flex-col items-center justify-start md:min-h-[104px]">
              {ucl && (
                <div key={`u${year}`} className="intro-pop flex flex-col items-center gap-2">
                  <span className="flex items-center gap-3 font-display text-[clamp(22px,4.6vw,46px)] font-semibold uppercase tracking-[0.14em] text-gold">
                    <Trophy aria-hidden className="size-[1em] text-[#f5c542]" strokeWidth={1.8} />
                    Champion d&rsquo;Europe
                  </span>
                  <span className="font-body text-[11.5px] font-semibold uppercase tracking-[0.24em] text-[#f7dc8e] md:text-[13px]">
                    Ligue des champions {year}
                    {current.l1 ? ` · Champion de France (${ordinal(l1Count)} titre)` : ""}
                  </span>
                </div>
              )}
              {l1Only && (
                <div key={`l${year}`} className="intro-pop flex flex-col items-center gap-2">
                  <span className="flex items-center gap-3 font-display text-[clamp(20px,3.8vw,38px)] font-semibold uppercase tracking-[0.14em] text-white">
                    <Star aria-hidden className="size-[0.9em] text-psg-red-bright" fill="currentColor" strokeWidth={0} />
                    Champion de France
                  </span>
                  <span className="font-body text-[11.5px] font-semibold uppercase tracking-[0.24em] text-white/75 md:text-[13px]">
                    Saison {year - 1}-{String(year).slice(2)} · {ordinal(l1Count)} titre
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="mx-auto w-full max-w-[1120px]">
            <div className="mb-3 flex items-end justify-between font-body text-[10px] uppercase tracking-[0.12em] text-white/75 md:text-[12px] md:tracking-[0.2em]">
              <span className="flex items-center gap-2 whitespace-nowrap">
                <Star aria-hidden className="size-3 text-psg-red-bright" fill="currentColor" strokeWidth={0} />
                Championnats {l1Count}
              </span>
              <span className={cn("flex items-center gap-2 whitespace-nowrap transition-colors", uclCount > 0 ? "text-[#f5c542]" : "")}>
                <Trophy aria-hidden className="size-3" strokeWidth={2} />
                Ligues des champions {uclCount}
              </span>
            </div>

            <div className="relative h-[6px] rounded-full bg-white/15">
              <div
                ref={barRef}
                style={{ transform: "scaleX(0)" }}
                className={cn(
                  "absolute inset-0 origin-left rounded-full",
                  gold ? "bg-[linear-gradient(90deg,#d90f2c_0%,#f0a020_60%,#ffe28a_100%)] shadow-[0_0_22px_rgba(245,197,66,0.85)]" : "bg-psg-red shadow-[0_0_16px_rgba(240,22,52,0.7)]",
                )}
              />
              {timeline.steps
                .filter((s) => s.l1 || s.ucl)
                .map((s) => {
                  const lit = year >= s.year;
                  return (
                    <span
                      key={s.year}
                      aria-hidden
                      className={cn(
                        "absolute top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full transition-[transform,background-color,box-shadow] duration-300",
                        s.ucl ? "size-[13px]" : "size-[9px]",
                        lit
                          ? s.ucl
                            ? "scale-110 bg-[#ffe28a] shadow-[0_0_14px_3px_rgba(245,197,66,0.9)]"
                            : "bg-white shadow-[0_0_10px_2px_rgba(240,22,52,0.9)]"
                          : "bg-white/30",
                      )}
                      style={{ left: `${s.progress * 100}%` }}
                    />
                  );
                })}
            </div>

            <div className="mt-3 flex items-center justify-between font-display text-[18px] font-semibold tracking-[0.12em] text-white md:text-[22px]">
              <span>{START_YEAR}</span>
              <span>{endYear}</span>
            </div>

            <p className={cn("mt-4 flex items-center justify-center gap-2 font-body text-[11px] uppercase tracking-[0.2em] text-white/60 transition-opacity", playing && "opacity-0")}>
              <Volume2 aria-hidden className="size-3.5" />
              Touchez l&rsquo;écran pour activer le son
            </p>
          </div>
        </div>
      </div>

      {exiting && (
        <>
          <div aria-hidden className="intro-gold-wash fixed inset-0 z-[101]" />
          <div aria-hidden className="intro-ring" />
        </>
      )}
    </div>
  );
}

function GoldConfetti() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-[5] overflow-hidden">
      {Array.from({ length: 56 }, (_, i) => {
        const left = (i * 37 + 11) % 100;
        const delay = ((i * 53) % 100) / 100;
        const size = 4 + ((i * 7) % 6);
        const dur = 1.5 + ((i * 13) % 12) / 10;
        const hue = ["#fff3c4", "#f5c542", "#e0a71b", "#ffe28a"][i % 4];
        return (
          <span
            key={i}
            className="intro-confetti"
            style={{ left: `${left}%`, width: size, height: size * 1.8, background: hue, animationDelay: `${delay}s`, animationDuration: `${dur}s` }}
          />
        );
      })}
    </div>
  );
}
