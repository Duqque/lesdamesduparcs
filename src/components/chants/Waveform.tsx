"use client";

import type { KeyboardEvent, PointerEvent } from "react";
import { cn } from "@/lib/cn";
import { formatClock } from "@/lib/format";

interface Props {
  peaks: number[];
  progress: number;
  playing: boolean;
  currentTime: number;
  duration: number;
  onSeek: (ratio: number) => void;
  className?: string;
}

/** Waveform cliquable / navigable au clavier, animée pendant la lecture. */
export function Waveform({ peaks, progress, playing, currentTime, duration, onSeek, className }: Props) {
  const handlePointer = (e: PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    onSeek((e.clientX - rect.left) / rect.width);
  };
  const handleKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowRight" || e.key === "ArrowUp") {
      e.preventDefault();
      onSeek(progress + 0.05);
    } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
      e.preventDefault();
      onSeek(progress - 0.05);
    }
  };

  return (
    <div
      role="slider"
      data-audio-control
      tabIndex={0}
      aria-label="Progression du chant"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(progress * 100)}
      aria-valuetext={`${formatClock(currentTime)} sur ${formatClock(duration)}`}
      onPointerDown={handlePointer}
      onKeyDown={handleKey}
      className={cn("flex h-7 cursor-pointer items-center gap-[2px]", playing && "wave-playing", className)}
    >
      {peaks.map((p, i) => {
        const played = i / peaks.length < progress;
        return (
          <span
            key={i}
            className={cn(
              "wave-bar block min-w-[1.5px] flex-1 rounded-full transition-colors duration-200",
              played ? "bg-psg-red-bright" : "bg-white/55",
            )}
            style={{ height: `${Math.max(12, p * 100)}%`, animationDelay: `${(i % 9) * -0.11}s` }}
          />
        );
      })}
    </div>
  );
}
