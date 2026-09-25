"use client";

import { useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { CountUp } from "./CountUp";

interface Tab {
  readonly label: string;
  readonly title: string;
  readonly paragraphs: readonly string[];
  readonly pulls: readonly string[];
  readonly stats: readonly { readonly value: string; readonly label: string }[];
}

/** Chapitre « Pourquoi un fan club 100 % féminin » : quatre volets à parcourir. */
export function WhyTabs({ tabs }: { tabs: readonly Tab[] }) {
  const [index, setIndex] = useState(0);
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  const onKey = (e: React.KeyboardEvent, i: number) => {
    const step = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key];
    if (!step) return;
    e.preventDefault();
    const next = (i + step + tabs.length) % tabs.length;
    setIndex(next);
    refs.current[next]?.focus();
  };

  return (
    <div className="grid gap-8 md:grid-cols-[0.8fr_1.6fr] md:gap-16">
      <div role="tablist" aria-label="Pourquoi un fan club 100 % féminin" className="grid h-max gap-2 md:sticky md:top-32">
        {tabs.map((t, i) => (
          <button
            key={t.label}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="tab"
            id={`why-tab-${i}`}
            aria-selected={index === i}
            aria-controls={`why-panel-${i}`}
            tabIndex={index === i ? 0 : -1}
            onClick={() => setIndex(i)}
            onKeyDown={(e) => onKey(e, i)}
            className={cn(
              "flex items-baseline gap-4 rounded-[10px] border px-5 py-4 text-left font-body text-[16px] font-semibold transition-[background-color,border-color,color] duration-300",
              index === i ? "border-psg-red-bright/60 bg-night-800 text-white" : "border-line bg-night-900/85 text-white/60 hover:text-white",
            )}
          >
            <span className="text-[12px] tabular-nums text-psg-red-bright">{String(i + 1).padStart(2, "0")}</span>
            {t.label}
          </button>
        ))}
      </div>

      <div className="rounded-[10px] border border-line bg-night-900/85 p-7 md:p-12">
        {tabs.map((t, i) => {
          const pullAfter = t.paragraphs.length > 2 ? 1 : 0;
          return (
            <div key={t.label} role="tabpanel" id={`why-panel-${i}`} aria-labelledby={`why-tab-${i}`} hidden={index !== i} className="space-y-6">
              <h3 className="max-w-[24ch] t-h2">{t.title}</h3>
              {t.stats.length > 0 && (
                <dl className="flex gap-12 py-2">
                  {t.stats.map((s) => (
                    <div key={s.label}>
                      <dt className="t-eyebrow">{s.label}</dt>
                      <dd className="mt-2 font-display text-[64px] font-semibold leading-none tabular-nums text-white">
                        <CountUp to={Number(s.value.replace(/\D/g, ""))} prefix="+" />
                      </dd>
                    </div>
                  ))}
                </dl>
              )}
              {t.paragraphs.map((p, k) => (
                <div key={p} className="space-y-6">
                  <p className={cn("max-w-[64ch] t-lead", p === "Unies par la même passion." ? "font-semibold text-white" : "text-white/80")}>{p}</p>
                  {k === pullAfter &&
                    t.pulls.map((pull) => (
                      <p key={pull} className="max-w-[22ch] py-2 t-h1 text-psg-red-bright">
                        {pull}
                      </p>
                    ))}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
