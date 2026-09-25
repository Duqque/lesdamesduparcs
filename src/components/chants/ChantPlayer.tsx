"use client";

import { Music2, Pause, Play, Volume2, VolumeX } from "lucide-react";
import { CardLabel } from "@/components/ui/CardLabel";
import { SpotifyIcon } from "@/components/icons/BrandIcons";
import { formatClock } from "@/lib/format";
import { useChantAudio } from "./AudioProvider";
import { Waveform } from "./Waveform";

export function ChantPlayer() {
  const { chant, playing, currentTime, duration, progress, volume, muted, toggle, seek, setVolume, toggleMute } = useChantAudio();

  return (
    <section
      aria-label="Le chant du groupe"
      className="rounded-[6px] border border-line bg-night-900/85 px-6 pb-6 pt-6 shadow-[0_18px_50px_-30px_rgba(0,0,0,0.9)] backdrop-blur-sm"
    >
      <div className="flex items-center justify-between">
        <CardLabel icon={Music2}>Le chant du groupe</CardLabel>
        <span className="font-body text-[11px] tabular-nums text-mist" aria-hidden>
          {formatClock(currentTime)} / {formatClock(duration)}
        </span>
      </div>

      <Waveform
        className="mt-6"
        peaks={chant.waveform}
        progress={progress}
        playing={playing}
        currentTime={currentTime}
        duration={duration}
        onSeek={seek}
      />

      <div className="mt-6 flex items-center gap-4">
        <button
          type="button"
          onClick={toggle}
          data-audio-control
          aria-label={playing ? `Mettre en pause ${chant.title}` : `Écouter ${chant.title}`}
          aria-pressed={playing}
          className="grid size-[42px] shrink-0 place-items-center rounded-full bg-psg-red text-white shadow-[0_8px_22px_-8px_rgba(217,15,44,0.9)] transition-[transform,background-color] duration-300 hover:scale-[1.06] hover:bg-psg-red-bright"
        >
          {playing ? <Pause aria-hidden className="size-[18px]" fill="currentColor" /> : <Play aria-hidden className="ml-0.5 size-[18px]" fill="currentColor" />}
        </button>
        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 font-body text-[13.5px] font-semibold leading-tight text-white">{chant.title}</p>
          <p className="truncate font-body text-[12px] text-mist">{chant.artist}</p>
        </div>
        <div className="group/vol flex items-center">
          <button
            type="button"
            onClick={toggleMute}
            data-audio-control
            aria-label={muted ? "Activer le son" : "Couper le son"}
            aria-pressed={muted}
            className="grid size-9 place-items-center rounded-full text-white/80 transition-colors hover:bg-white/10 hover:text-white"
          >
            {muted ? <VolumeX aria-hidden className="size-4" /> : <Volume2 aria-hidden className="size-4" />}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={muted ? 0 : volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            aria-label="Volume"
            data-audio-control
            className="h-1 w-0 cursor-pointer appearance-none rounded-full bg-white/25 opacity-0 accent-psg-red transition-[width,opacity] duration-300 focus:w-14 focus:opacity-100 group-hover/vol:w-14 group-hover/vol:opacity-100 [&::-webkit-slider-thumb]:size-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
          />
        </div>
        <a
          href={chant.spotifyUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Écouter ${chant.title} sur Spotify`}
          className="grid size-9 shrink-0 place-items-center rounded-full bg-white text-night-950 transition-transform duration-300 hover:scale-110"
        >
          <SpotifyIcon className="size-[20px]" />
        </a>
      </div>
    </section>
  );
}
