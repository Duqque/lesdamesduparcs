import { Handshake, Globe, Megaphone, Sparkles, Users, Venus, Heart, Landmark, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { groupe as g } from "@/data/groupe";
import { CountUp } from "./CountUp";
import { Timeline } from "./Timeline";
import { ValueIcon } from "./ValueIcon";
import { bigc, card, h2c, pullc, wrap } from "./styles";

/** 01 · Lettre d'introduction */
export function LetterBody() {
  return (
    <div className={wrap}>
      <Reveal>
        <p className="max-w-[26ch] break-words text-[clamp(26px,4vw,56px)] font-semibold leading-[1.1] text-white">{g.letter.statement}</p>
      </Reveal>
      <div className="mt-16 grid gap-12 md:grid-cols-[0.9fr_1.1fr] md:gap-20">
        <Reveal className="min-w-0">
          <p className={`${pullc} max-w-[16ch]`}>{g.letter.pull}</p>
        </Reveal>
        <div className="min-w-0 space-y-6">
          {g.letter.paragraphs.map((p) => (
            <Reveal key={p}>
              <p className="max-w-[52ch] break-words text-white/80 t-lead">{p}</p>
            </Reveal>
          ))}
          <Reveal>
            <p className="pt-2 font-display text-[26px] font-semibold uppercase tracking-[0.05em] text-white">Les Dames du Parc</p>
          </Reveal>
        </div>
      </div>
    </div>
  );
}

/** 02 · Notre histoire */
export function StoryBody() {
  return (
    <div className={`${wrap} max-w-[820px]`}>
      <Timeline items={g.story} label="Notre histoire en cinq étapes" />
    </div>
  );
}

/** 03 · Qui sommes-nous ? */
export function WhoBody() {
  return (
    <div className={wrap}>
      <Reveal>
        <p className="max-w-[34ch] break-words text-[clamp(22px,3vw,40px)] font-medium leading-[1.16] text-white">{g.who.lead}</p>
      </Reveal>
      <ul className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {g.who.figures.map((f, i) => (
          <li key={f.label} className="min-w-0">
            <Reveal delay={i * 0.05} className="h-full">
              <div className={`${card} flex h-full min-h-[190px] flex-col justify-between gap-6 p-6`}>
                <p className="font-display text-[clamp(48px,5vw,72px)] font-semibold leading-none tabular-nums text-white">
                  {f.count !== null ? <CountUp to={f.count} /> : (f as { value: string }).value}
                </p>
                <p className="break-words text-mist t-small">{f.label}</p>
              </div>
            </Reveal>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** 04 · Nos valeurs */
export function ValuesBody() {
  return (
    <div className={wrap}>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {g.values.map((v, i) => (
          <li key={v.title} className="min-w-0">
            <Reveal delay={(i % 3) * 0.06} className="h-full">
              <div className={`${card} flex h-full min-h-[240px] flex-col justify-between gap-8 p-7`}>
                <div className="flex items-center justify-between gap-4">
                  <ValueIcon name={v.title} />
                  <p className="text-[12px] font-semibold tabular-nums tracking-[0.2em] text-psg-red-bright">{String(i + 1).padStart(2, "0")}</p>
                </div>
                <div>
                  <h2 className="break-words font-display text-[clamp(28px,3vw,40px)] font-semibold uppercase leading-[1.05] tracking-[0.04em] text-white">{v.title}</h2>
                  <p className="mt-3 break-words text-white/75 t-small">{v.text}</p>
                </div>
              </div>
            </Reveal>
          </li>
        ))}
      </ul>
    </div>
  );
}

const whyIcons: LucideIcon[] = [Megaphone, Users, Heart, Landmark];

/** 05 · Pourquoi un fan club 100 % féminin */
export function WhyBody() {
  return (
    <div className={wrap}>
      <Reveal>
        <p className={`${bigc} max-w-[16ch]`}>{g.why.pull}</p>
      </Reveal>
      <ul className="mt-14 grid gap-4 sm:grid-cols-2">
        {g.why.items.map((it, i) => {
          const Icon = whyIcons[i] ?? Venus;
          return (
            <li key={it.title} className="min-w-0">
              <Reveal delay={(i % 2) * 0.06} className="h-full">
                <div className={`${card} flex h-full flex-col gap-4 p-7`}>
                  <Icon aria-hidden className="size-7 text-psg-red-bright" strokeWidth={1.6} />
                  <h2 className="break-words font-display text-[clamp(22px,2.4vw,30px)] font-semibold uppercase tracking-[0.04em] text-white">{it.title}</h2>
                  <p className="break-words text-white/75 t-small">{it.text}</p>
                </div>
              </Reveal>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

const buildIcons: LucideIcon[] = [Users, Handshake, Globe, Sparkles];

/** 06 · Ce que nous voulons construire */
export function BuildBody() {
  return (
    <div className={wrap}>
      <ul className="grid gap-4 md:grid-cols-2">
        {g.build.map((b, i) => {
          const Icon = buildIcons[i] ?? Sparkles;
          return (
            <li key={b.title} className="min-w-0">
              <Reveal delay={(i % 2) * 0.06} className="h-full">
                <div className={`${card} flex h-full flex-col gap-5 p-7 md:p-9`}>
                  <div className="flex items-center justify-between gap-4">
                    <span aria-hidden className="grid size-14 place-items-center overflow-hidden rounded-full border border-psg-red-bright/50 bg-night-800">
                      <Icon className="size-6 text-white" strokeWidth={1.6} />
                    </span>
                    <p className="font-display text-[40px] font-semibold leading-none tabular-nums text-psg-red-bright">{String(i + 1).padStart(2, "0")}</p>
                  </div>
                  <h2 className={h2c}>{b.title}</h2>
                  <p className="break-words text-white/75 t-lead">{b.text}</p>
                </div>
              </Reveal>
            </li>
          );
        })}
      </ul>
      <Reveal className="mt-14 flex flex-col items-start gap-4 sm:flex-row">
        <Button size="lg" href="/rejoindre-le-groupe/adhesion">Rejoindre la communauté</Button>
        <Button size="lg" variant="outline" href="/evenements" arrow={false}>Voir les événements</Button>
      </Reveal>
    </div>
  );
}
