"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { Star, Trophy, Volume2 } from "lucide-react";
import { useChantAudio } from "@/components/chants/AudioProvider";
import { championsLeagueYears, ligue1Years, loaderPhotos, START_YEAR } from "@/data/palmares";
import { cn } from "@/lib/cn";
import { finishIntro, hasSeenIntro, useIntroDone } from "@/lib/intro";

const YEAR_MS = 46;
const L1_HOLD_MS = 240;
const UCL_HOLD_MS = 900;
const END_HOLD_MS = 400;

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

  const trophies = timeline.steps.filter((st) => (st.l1 || st.ucl) && st.year <= year);
  const gold = uclCount > 0;

  return (
    <div className="intro-root" role="status" aria-live="polite" aria-label="Chargement du site">
      <div className={cn("intro-loader fixed inset-0 z-[100] overflow-hidden bg-night-950 text-white", exiting && "is-exiting")}>
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
                  "object-cover transition-[opacity,transform] duration-[900ms,4500ms] ease-out",
                  i === photo ? "scale-[1.06] opacity-100" : "scale-100 opacity-0",
                )}
              />
            ) : null,
          )}
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(3,9,25,0.55)_0%,transparent_45%),linear-gradient(180deg,rgba(3,9,25,0.35)_0%,transparent_22%,transparent_45%,rgba(3,9,25,0.88)_100%)]" />
        </div>

        <div className="relative z-10 flex h-full flex-col justify-between [text-shadow:0_1px_10px_rgba(3,9,25,0.85)] px-[var(--gutter)] pb-7 pt-6 md:pb-10 md:pt-8">
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
            <ul aria-label="Titres du Paris Saint-Germain" className="mb-5 flex flex-col gap-1.5 md:mb-6">
              {trophies.map((t) => {
                const isNow = t.year === year;
                return (
                  <li
                    key={t.year}
                    className={cn(
                      "intro-row flex items-center gap-3 font-body text-[11px] uppercase tracking-[0.16em] transition-opacity duration-500 md:text-[12px]",
                      t.ucl ? "text-[#f5d16b]" : "text-white",
                      isNow ? "opacity-100" : "opacity-60",
                    )}
                  >
                    <span className="w-10 font-display text-[15px] font-semibold tracking-[0.08em] tabular-nums md:text-[17px]">{t.year}</span>
                    <span aria-hidden className={cn("h-px w-6", t.ucl ? "bg-[#f5d16b]" : "bg-white/60")} />
                    {t.l1 && <Star aria-hidden className={cn("size-3", t.ucl ? "text-[#f5d16b]" : "text-psg-red-bright")} fill="currentColor" strokeWidth={0} />}
                    {t.ucl && <Trophy aria-hidden className="size-3.5" strokeWidth={2} />}
                    <span>{t.ucl ? (t.l1 ? "Championnat · Ligue des champions" : "Ligue des champions") : "Championnat"}</span>
                  </li>
                );
              })}
            </ul>

            <div className="flex items-end justify-between gap-6">
              <div className="font-display text-[clamp(44px,6vw,76px)] font-semibold leading-none tracking-[0.04em] tabular-nums" aria-label={`Année ${year}`}>
                {year}
              </div>
              <p className={cn("hidden items-center gap-2 pb-1 font-body text-[10px] uppercase tracking-[0.2em] text-white/55 transition-opacity sm:flex", playing && "opacity-0")}>
                <Volume2 aria-hidden className="size-3.5" />
                Touchez pour le son
              </p>
            </div>

            <div className="relative mt-3 h-[2px] rounded-full bg-white/25">
              <div
                ref={barRef}
                style={{ transform: "scaleX(0)" }}
                className={cn("absolute inset-0 origin-left rounded-full", gold ? "bg-[linear-gradient(90deg,#fff,#f5d16b)]" : "bg-white")}
              />
              {timeline.steps
                .filter((st) => st.l1 || st.ucl)
                .map((st) => (
                  <span
                    key={st.year}
                    aria-hidden
                    className={cn(
                      "absolute top-1/2 size-[5px] -translate-x-1/2 -translate-y-1/2 rounded-full transition-colors duration-300",
                      year >= st.year ? (st.ucl ? "bg-[#f5d16b]" : "bg-psg-red-bright") : "bg-white/40",
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
