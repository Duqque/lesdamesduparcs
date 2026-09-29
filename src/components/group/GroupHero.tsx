"use client";

import { useRef } from "react";
import { Button } from "@/components/ui/Button";
import { Logo3D } from "./Logo3D";
import { JoinGate } from "@/components/member/JoinGate";

export function GroupHero({ title = "Les Dames\ndu Parc", intro = "Une communauté de supportrices réunies par la même passion : le Paris Saint-Germain.", button = "Lire notre histoire" }: { title?: string; intro?: string; button?: string }) {
  const ref = useRef<HTMLElement>(null);
  return (
    <section ref={ref} aria-labelledby="group-title" className="relative isolate overflow-hidden px-[var(--gutter)] pb-24 pt-[190px] md:pb-36 md:pt-[260px]">
      <div aria-hidden className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_60%_60%_at_72%_45%,rgba(26,52,112,0.5),transparent_70%)]" />
      <div className="mx-auto grid max-w-[1400px] items-center gap-10 md:min-h-[calc(100svh-190px)] md:grid-cols-[1.05fr_0.95fr] md:gap-6">
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
