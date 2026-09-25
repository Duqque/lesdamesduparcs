"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { BookOpen, Coffee, Heart, Landmark, MessageCircle, Smartphone, Trophy, type LucideIcon } from "lucide-react";
import { Reveal } from "@/components/ui/Reveal";
import { cn } from "@/lib/cn";

interface Step {
  readonly id: string;
  readonly title: string;
  readonly paragraphs: readonly string[];
  readonly pull: string | null;
}

const anchor = (id: string) => `histoire-${id}`;
const stepIcons: LucideIcon[] = [MessageCircle, Heart, Smartphone, Trophy, Coffee, Landmark, BookOpen];

/** Récit en étapes : sommaire collant à gauche, étape courante mise en avant. */
export function StoryTimeline({ steps }: { steps: readonly Step[] }) {
  const [active, setActive] = useState(anchor(steps[0].id));

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setActive(e.target.id)),
      { rootMargin: "-30% 0px -60% 0px" },
    );
    steps.forEach((s) => {
      const el = document.getElementById(anchor(s.id));
      if (el) io.observe(el);
    });
    return () => io.disconnect();
  }, [steps]);

  return (
    <div className="grid gap-10 md:grid-cols-[0.8fr_1.6fr] md:gap-20">
      <nav aria-label="Étapes de notre histoire" className="hidden md:block">
        <div className="sticky top-32">
          <p className="t-eyebrow">Comment tout a commencé</p>
          <ol className="mt-6 space-y-1">
            {steps.map((s, i) => (
              <li key={s.id}>
                <a
                  href={`#${anchor(s.id)}`}
                  aria-current={active === anchor(s.id) ? "step" : undefined}
                  className={cn(
                    "flex gap-4 border-l-2 py-2.5 pl-5 font-body text-[15px] font-medium transition-[color,border-color,padding] duration-300",
                    active === anchor(s.id) ? "border-psg-red-bright pl-7 text-white" : "border-white/10 text-white/55 hover:text-white",
                  )}
                >
                  <span className="tabular-nums text-psg-red-bright">{String(i + 1).padStart(2, "0")}</span>
                  <span>{s.title}</span>
                </a>
              </li>
            ))}
          </ol>
        </div>
      </nav>

      <ol className="space-y-16 md:space-y-24">
        {steps.map((s, i) => (
          <li key={s.id} id={anchor(s.id)} className="scroll-mt-32">
            <Reveal className="space-y-6">
              <div className="flex min-w-0 items-center gap-4">
                <span aria-hidden className="grid size-12 shrink-0 place-items-center overflow-hidden rounded-full border border-psg-red-bright/50 bg-night-800">
                  {(() => {
                    const Icon = stepIcons[i] ?? BookOpen;
                    return <Icon className="size-5 text-white" strokeWidth={1.6} />;
                  })()}
                </span>
                <p className="min-w-0 break-words t-eyebrow">
                  {String(i + 1).padStart(2, "0")} · {s.title}
                </p>
              </div>
              {s.paragraphs.map((p) => (
                <p key={p} className="max-w-[62ch] break-words text-white/80 t-lead">
                  {p}
                </p>
              ))}
              {s.pull && <p className="max-w-[20ch] break-words pt-4 font-display text-[clamp(30px,4.4vw,60px)] font-semibold uppercase leading-[1.02] tracking-[0.04em] text-psg-red-bright">{s.pull}</p>}
            </Reveal>
            {s.id === "s4" && (
              <Reveal delay={0.1} className="mt-12">
                <figure className="relative aspect-[3/2] overflow-hidden rounded-[8px] border border-line">
                  <Image
                    src="/images/supportrices-parc-des-princes.webp"
                    alt="Des supportrices et supporters du Paris Saint-Germain qui chantent dans les gradins, écharpes et drapeaux aux couleurs du club"
                    fill
                    sizes="(min-width: 768px) 55vw, 100vw"
                    className="object-cover"
                  />
                  <div aria-hidden className="absolute inset-0 bg-[linear-gradient(180deg,transparent_60%,rgba(3,9,25,0.55))]" />
                </figure>
              </Reveal>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}
