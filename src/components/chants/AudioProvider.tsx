"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { Chant } from "@/types";

interface ChantAudio {
  chant: Chant;
  playing: boolean;
  currentTime: number;
  duration: number;
  progress: number;
  volume: number;
  muted: boolean;
  toggle: () => void;
  seek: (ratio: number) => void;
  setVolume: (value: number) => void;
  toggleMute: () => void;
}

const PREF_KEY = "ddp-music";

const Ctx = createContext<ChantAudio | null>(null);

export function useChantAudio() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useChantAudio doit être utilisé dans <AudioProvider>");
  return ctx;
}

export function AudioProvider({ chant, children }: { chant: Chant; children: ReactNode }) {
  const ref = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(chant.duration);
  const [volume, setVolumeState] = useState(0.6);
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    const audio = ref.current;
    if (!audio) return;
    const sync = () => {
      setCurrentTime(audio.currentTime);
      if (Number.isFinite(audio.duration) && audio.duration > 0) setDuration(audio.duration);
    };
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    audio.addEventListener("timeupdate", sync);
    audio.addEventListener("loadedmetadata", sync);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("ended", onPause);
    return () => {
      audio.removeEventListener("timeupdate", sync);
      audio.removeEventListener("loadedmetadata", sync);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("ended", onPause);
    };
  }, []);

  useEffect(() => {
    const audio = ref.current;
    if (!audio) return;
    audio.volume = 0.6;
    try {
      if (localStorage.getItem(PREF_KEY) === "off") return;
    } catch {}
    const events = ["pointerdown", "keydown", "touchend"] as const;
    const remove = () => events.forEach((e) => window.removeEventListener(e, tryPlay));
    function tryPlay(e?: Event) {
      if (e?.target instanceof Element && e.target.closest("[data-audio-control]")) return;
      audio!.play().then(remove).catch(() => {});
    }
    events.forEach((e) => window.addEventListener(e, tryPlay, { passive: true }));
    tryPlay();
    return remove;
  }, []);

  const toggle = useCallback(() => {
    const audio = ref.current;
    if (!audio) return;
    if (audio.paused) {
      audio.play().catch(() => setPlaying(false));
      try {
        localStorage.setItem(PREF_KEY, "on");
      } catch {}
    } else {
      audio.pause();
      try {
        localStorage.setItem(PREF_KEY, "off");
      } catch {}
    }
  }, []);

  const seek = useCallback(
    (ratio: number) => {
      const audio = ref.current;
      if (!audio) return;
      const total = Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : duration;
      audio.currentTime = Math.min(Math.max(ratio, 0), 1) * total;
      setCurrentTime(audio.currentTime);
    },
    [duration],
  );

  const setVolume = useCallback((value: number) => {
    const audio = ref.current;
    if (!audio) return;
    audio.volume = value;
    audio.muted = value === 0;
    setVolumeState(value);
    setMuted(value === 0);
  }, []);

  const toggleMute = useCallback(() => {
    const audio = ref.current;
    if (!audio) return;
    audio.muted = !audio.muted;
    setMuted(audio.muted);
  }, []);

  const value = useMemo<ChantAudio>(
    () => ({
      chant,
      playing,
      currentTime,
      duration,
      progress: duration > 0 ? Math.min(currentTime / duration, 1) : 0,
      volume,
      muted,
      toggle,
      seek,
      setVolume,
      toggleMute,
    }),
    [chant, playing, currentTime, duration, volume, muted, toggle, seek, setVolume, toggleMute],
  );

  return (
    <Ctx.Provider value={value}>
      <audio ref={ref} src={chant.audioSrc} preload="auto" loop />
      {children}
    </Ctx.Provider>
  );
}
