"use client";

import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { playlist } from "@/data/chants";
import { useChantAudio } from "./AudioProvider";

const BARS = 44;

export function ChantsBanner() {
  const { chant, playing, progress } = useChantAudio();
  const step = chant.waveform.length / BARS;
  const bars = Array.from({ length: BARS }, (_, i) => chant.waveform[Math.floor(i * step)] ?? 0.1);

  return (
    <section
      aria-labelledby="chants-title"
      data-cursor="view"
      className="relative flex w-full min-h-[240px] flex-col justify-center gap-7 overflow-hidden rounded-[8px] border border-line bg-[linear-gradient(100deg,#08172f_0%,#0b2149_55%,#10285a_100%)] p-7 md:min-h-[220px] md:flex-row md:items-center md:gap-10 md:py-8 md:pl-10 md:pr-8"
    >
      <Image
        src="/logos/dames-du-parc-logo.webp"
        alt=""
        width={280}
        height={280}
        aria-hidden
        className="pointer-events-none absolute -right-8 top-1/2 size-[210px] -translate-y-1/2 rounded-full opacity-[0.1] mix-blend-luminosity"
      />
      <div aria-hidden className="pointer-events-none absolute inset-y-0 right-0 w-1/3 bg-[radial-gradient(ellipse_at_100%_50%,rgba(217,15,44,0.2),transparent_70%)]" />

      <div className="relative z-10 min-w-0 md:shrink-0">
        <h2 id="chants-title" className="font-body text-[14px] font-bold uppercase tracking-[0.07em] text-white md:text-[15px]">
          {playlist.title}
        </h2>
        <p className="mt-3 font-body text-[13px] text-mist">{playlist.tagline}</p>
        <div className="mt-6">
          <Button variant="outline" href={playlist.href} external className="w-full sm:w-auto">
            Écouter la playlist
          </Button>
        </div>
      </div>

      <div
        aria-hidden
        className={cn("relative z-10 flex h-[54px] flex-1 items-center justify-center gap-[3px] md:max-w-[240px] xl:max-[1499px]:hidden", playing && "wave-playing")}
      >
        {bars.map((p, i) => {
          const played = i / BARS < progress;
          return (
            <span
              key={i}
              className={cn("wave-bar block w-[2px] rounded-full transition-colors duration-200", played ? "bg-psg-red-bright" : "bg-white")}
              style={{ height: `${Math.max(10, p * 100)}%`, animationDelay: `${(i % 11) * -0.09}s` }}
            />
          );
        })}
      </div>
    </section>
  );
}
