"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { Volume2 } from "lucide-react";
import { useChantAudio } from "@/components/chants/AudioProvider";
import { loaderPhotos, START_YEAR, trophies } from "@/data/palmares";
import { cn } from "@/lib/cn";
import { finishIntro, hasSeenIntro, useIntroDone } from "@/lib/intro";

const YEAR_MS = 40;
const TROPHY_HOLD_MS = 110;
const UCL_HOLD_MS = 800;
const END_HOLD_MS = 400;
const PHOTO_MS = 1500;

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
  count: number;
  ucl: boolean;
}

function buildTimeline(endYear: number) {
  const span = Math.max(endYear - START_YEAR, 1);
  const steps: Step[] = [];
  let t = 0;
  for (let y = START_YEAR; y <= endYear; y++) {
    const won = trophies.filter((c) => c.years.includes(y));
    const ucl = won.some((c) => c.id === "ldc");
    const hold = ucl ? UCL_HOLD_MS : won.length ? TROPHY_HOLD_MS : 0;
    steps.push({ year: y, arrive: t, leave: t + hold, progress: (y - START_YEAR) / span, count: won.length, ucl });
    t += hold + YEAR_MS;
  }
  const total = t - YEAR_MS + END_HOLD_MS;
  const photoCount = Math.max(2, Math.min(loaderPhotos.length, Math.round(total / PHOTO_MS)));
  const photos = Array.from({ length: photoCount }, (_, i) => loaderPhotos[Math.round((i * (loaderPhotos.length - 1)) / (photoCount - 1))]);
  return { steps, total, photos };
}

const toneClass = { gold: "text-[#f5d16b]", red: "text-white", white: "text-white" } as const;

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
    const { steps, total, photos } = timeline;
    const t0 = performance.now();
    let idx = 0;
    let lastYear = START_YEAR;
    let lastPhoto = 0;

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
      const ph = Math.min(photos.length - 1, Math.floor((t / total) * photos.length));
      if (ph !== lastPhoto) {
        lastPhoto = ph;
        setPhoto(ph);
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

  const rows = trophies
    .map((c) => ({ ...c, won: c.years.filter((y) => y <= year && y <= endYear) }))
    .filter((c) => c.won.length > 0);
  const total = rows.reduce((n, c) => n + c.won.length, 0);
  const gold = rows.some((c) => c.id === "ldc");
  const tickYears = timeline.steps.filter((s) => s.count > 0);

  return (
    <div className="intro-root" role="status" aria-live="polite" aria-label="Chargement du site">
      <div className={cn("intro-loader fixed inset-0 z-[100] overflow-hidden bg-night-950 text-white", exiting && "is-exiting")}>
        <div aria-hidden className="absolute inset-0">
          {timeline.photos.map((src, i) =>
            i >= photo - 1 && i <= photo + 1 ? (
              <Image
                key={src}
                src={src}
                alt=""
                fill
                sizes="100vw"
                loading="eager"
                priority={i === 0}
                style={{ zIndex: i }}
                className={cn(
                  "object-cover transition-[opacity,transform] duration-[1400ms,5000ms] ease-in-out",
                  i <= photo ? "scale-[1.06] opacity-100" : "scale-100 opacity-0",
                )}
              />
            ) : null,
          )}
          <div className="absolute inset-0 z-[50] bg-[linear-gradient(90deg,rgba(3,9,25,0.55)_0%,transparent_50%),linear-gradient(180deg,rgba(3,9,25,0.35)_0%,transparent_22%,transparent_40%,rgba(3,9,25,0.9)_100%)]" />
        </div>

        <div className="relative z-[60] flex h-full flex-col justify-between px-[var(--gutter)] pb-7 pt-6 [text-shadow:0_1px_10px_rgba(3,9,25,0.85)] md:pb-10 md:pt-8">
          <div className="flex items-center justify-between">
            <Image src="/logos/dames-du-parc-logo.webp" alt="Les Dames du Parc" width={40} height={40} priority className="size-10 rounded-full" />
            <button
              type="button"
              onClick={startExit}
              className="min-h-11 px-2 font-body text-[11px] font-medium uppercase tracking-[0.2em] text-white/70 transition-colors hover:text-white"
            >
              Passer
            </button>
          </div>

          <div className="mx-auto w-full max-w-[1240px]">
            <ul aria-label="Titres du Paris Saint-Germain" className="mb-5 flex flex-col gap-1 md:mb-6 md:gap-1.5">
              {rows.map((c) => (
                <li key={c.id} className={cn("intro-row grid grid-cols-[minmax(150px,auto)_1fr] items-baseline gap-x-4 md:grid-cols-[270px_1fr]", toneClass[c.tone])}>
                  <span className="flex items-baseline gap-2.5 font-body text-[10px] font-medium uppercase tracking-[0.16em] md:text-[11.5px]">
                    <span className="w-6 text-right font-display text-[16px] font-semibold tracking-normal tabular-nums md:text-[18px]">{c.won.length}</span>
                    {c.label}
                  </span>
                  <span className="hidden flex-wrap gap-x-2.5 gap-y-0.5 font-body text-[11px] tabular-nums tracking-[0.06em] sm:flex md:text-[12px]">
                    {c.won.map((y) => (
                      <span key={y} className={cn("intro-row transition-opacity duration-500", y === year ? "opacity-100" : "opacity-65")}>
                        {y}
                      </span>
                    ))}
                  </span>
                </li>
              ))}
            </ul>

            <div className="flex items-end justify-between gap-6">
              <div className="font-display text-[clamp(44px,6vw,76px)] font-semibold leading-none tracking-[0.04em] tabular-nums" aria-label={`Année ${year}`}>
                {year}
              </div>
              <div className="flex flex-col items-end gap-1 pb-1 text-right">
                <p className="font-body text-[10px] font-medium uppercase tracking-[0.2em] text-white/70">
                  Titres <span className={cn("ml-1 font-display text-[22px] font-semibold tracking-normal tabular-nums md:text-[26px]", gold ? "text-[#f5d16b]" : "text-white")}>{total}</span>
                </p>
                <p className={cn("hidden items-center gap-2 font-body text-[10px] uppercase tracking-[0.2em] text-white/55 transition-opacity sm:flex", playing && "opacity-0")}>
                  <Volume2 aria-hidden className="size-3.5" />
                  Touchez pour le son
                </p>
              </div>
            </div>

            <div className="relative mt-3 h-[2px] rounded-full bg-white/25">
              <div
                ref={barRef}
                style={{ transform: "scaleX(0)" }}
                className={cn("absolute inset-0 origin-left rounded-full", gold ? "bg-[linear-gradient(90deg,#fff,#f5d16b)]" : "bg-white")}
              />
              {tickYears.map((st) => (
                <span
                  key={st.year}
                  aria-hidden
                  className={cn(
                    "absolute top-1/2 size-[4px] -translate-x-1/2 -translate-y-1/2 rounded-full transition-colors duration-300",
                    year >= st.year ? (st.ucl ? "bg-[#f5d16b]" : "bg-psg-red-bright") : "bg-white/35",
                  )}
                  style={{ left: `${st.progress * 100}%` }}
                />
              ))}
            </div>
            <div className="mt-2 flex justify-between font-body text-[10px] font-medium tracking-[0.2em] text-white/70">
              <span>{START_YEAR}</span>
              <span>{endYear}</span>
            </div>
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
