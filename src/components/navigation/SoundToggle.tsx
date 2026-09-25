"use client";

import { Volume2, VolumeX } from "lucide-react";
import { useChantAudio } from "@/components/chants/AudioProvider";
import { cn } from "@/lib/cn";

export function SoundToggle({ className }: { className?: string }) {
  const { playing, toggle, chant } = useChantAudio();
  return (
    <button
      type="button"
      data-audio-control
      onClick={toggle}
      aria-pressed={playing}
      aria-label={playing ? `Couper la musique (${chant.title})` : `Lancer la musique (${chant.title})`}
      className={cn(className)}
    >
      {playing ? <Volume2 aria-hidden className="size-[19px]" strokeWidth={1.7} /> : <VolumeX aria-hidden className="size-[19px]" strokeWidth={1.7} />}
      {playing && <span aria-hidden className="absolute right-[7px] top-[7px] size-[6px] animate-pulse rounded-full bg-psg-red-bright" />}
    </button>
  );
}
