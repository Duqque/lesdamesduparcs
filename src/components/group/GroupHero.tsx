"use client";

import { useRef } from "react";
import { Button } from "@/components/ui/Button";
import { Logo3D } from "./Logo3D";

export function GroupHero() {
  const ref = useRef<HTMLElement>(null);
  return (
    <section ref={ref} aria-labelledby="group-title" className="relative isolate overflow-hidden px-[var(--gutter)] pb-24 pt-[190px] md:pb-36 md:pt-[260px]">
      <div aria-hidden className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_60%_60%_at_72%_45%,rgba(26,52,112,0.5),transparent_70%)]" />
      <div className="mx-auto grid max-w-[1400px] items-center gap-10 md:min-h-[calc(100svh-190px)] md:grid-cols-[1.05fr_0.95fr] md:gap-6">
        <div className="order-2 md:order-1">
          <p className="font-body text-[12px] font-semibold uppercase tracking-[0.3em] text-psg-red-bright">Le groupe</p>
          <h1 id="group-title" className="mt-4 font-display text-[clamp(44px,7vw,108px)] font-semibold uppercase leading-[0.95] tracking-[0.06em] text-white">
            Les Dames
            <br />
            du Parc
          </h1>
          <p className="mt-8 max-w-lg font-body text-[16px] leading-[1.8] text-white/85 md:text-[18px]">
            Des supportrices du Paris Saint-Germain, rassemblées par une même ferveur et par la fierté d&rsquo;aimer le club de la capitale.
          </p>
          <div className="mt-12 flex flex-col gap-4 sm:flex-row">
            <Button size="lg" href="/rejoindre-le-groupe">
              Devenir membre
            </Button>
            <Button size="lg" variant="outline" href="/communaute">
              La communauté
            </Button>
          </div>
        </div>
        <div className="order-1 md:order-2">
          <Logo3D scrollTarget={ref} />
        </div>
      </div>
    </section>
  );
}
