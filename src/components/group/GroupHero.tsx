"use client";

import { useRef } from "react";
import { Button } from "@/components/ui/Button";
import { HeroBackdrop } from "@/components/hero/HeroBackdrop";
import { Logo3D } from "./Logo3D";
import { JoinGate } from "@/components/member/JoinGate";

export function GroupHero({
  title = "Les Dames\ndu Parc",
  intro = "Une communauté de supportrices réunies par la même passion : le Paris Saint-Germain.",
  button = "Lire notre histoire",
  image,
  imageAlt,
}: {
  title?: string;
  intro?: string;
  button?: string;
  image?: string;
  imageAlt?: string;
}) {
  const ref = useRef<HTMLElement>(null);
  return (
    <section ref={ref} aria-labelledby="group-title" className="relative isolate overflow-hidden px-[var(--gutter)] pb-24 pt-[190px] md:pb-36 md:pt-[260px]">
      {/* Photo de fond, dans le même traitement que la première section de l'accueil. */}
      <HeroBackdrop src={image} alt={imageAlt} />
      <div
        aria-hidden
        className="absolute inset-0 z-[1] bg-[linear-gradient(100deg,rgba(3,9,25,0.92)_0%,rgba(3,9,25,0.72)_32%,rgba(3,9,25,0.32)_60%,rgba(3,9,25,0.18)_100%),linear-gradient(0deg,rgba(3,9,25,0.85)_0%,rgba(3,9,25,0.15)_30%,rgba(3,9,25,0.15)_70%,rgba(3,9,25,0.85)_100%)]"
      />
      <div className="relative z-10 mx-auto grid max-w-[1400px] items-center gap-10 md:min-h-[calc(100svh-190px)] md:grid-cols-[1.05fr_0.95fr] md:gap-6">
        <div className="order-2 md:order-1">
          <p className="t-eyebrow">Qui sommes-nous</p>
          <h1 id="group-title" className="mt-4 t-display">
            {title.split("\n").map((line, i) => (
              <span key={i}>
                {i > 0 && <br />}
                {line}
              </span>
            ))}
          </h1>
          <p className="mt-8 max-w-lg text-white/85 t-lead">
            {intro}
          </p>
          <div className="mt-12 flex flex-col gap-4 sm:flex-row">
            <Button size="lg" href="#origine">
              {button}
            </Button>
            <JoinGate>
              <Button size="lg" variant="outline" href="/rejoindre-le-groupe">
                Devenir membre
              </Button>
            </JoinGate>
          </div>
        </div>
        <div className="order-1 md:order-2">
          <Logo3D scrollTarget={ref} />
        </div>
      </div>
    </section>
  );
}
