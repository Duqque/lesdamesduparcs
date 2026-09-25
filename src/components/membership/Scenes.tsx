"use client";

import Link from "next/link";
import Image from "next/image";
import { motion, useTransform, type MotionValue } from "framer-motion";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { agenda, benefits, membership, newsletters } from "@/data/membership";
import { formatDay, formatMonthShort } from "@/lib/format";
import { cn } from "@/lib/cn";
import { useWindow } from "./pose";
import { WalletButton } from "./WalletButton";

/*
 * La carte est fixe au centre. Chaque scène vit dans une zone qui ne la recouvre jamais :
 * .zone-top / .zone-bottom (au-dessus / au-dessous), .zone-left / .zone-right (colonnes latérales, bureau).
 */

interface SceneProps {
  p: MotionValue<number>;
  desk: MotionValue<number>;
}

const label = "font-body text-[11px] font-semibold uppercase tracking-[0.3em] text-psg-red-bright md:text-[12px]";
const panel =
  "rounded-[8px] border border-white/12 bg-[linear-gradient(135deg,rgba(14,28,54,0.96),rgba(4,9,20,0.96))] shadow-[0_20px_40px_-22px_rgba(0,0,0,0.9)]";

/** Apparition / disparition avec flou et légère dérive, pilotées par le scroll. */
function useScene(p: MotionValue<number>, a: number, b: number, c: number, d: number) {
  const opacity = useWindow(p, a, b, c, d);
  const y = useTransform(p, [a, b, c, d], [22, 0, 0, -22]);
  const filter = useTransform(opacity, (v) => `blur(${(1 - v) * 9}px)`);
  const pointerEvents = useTransform(opacity, (v) => (v > 0.6 ? "auto" : "none")) as MotionValue<"auto" | "none">;
  return { opacity, y, filter, pointerEvents };
}

function Scene({ p, range, className, children }: { p: MotionValue<number>; range: [number, number, number, number]; className?: string; children: ReactNode }) {
  const s = useScene(p, ...range);
  return (
    <motion.div style={s} className={cn("z-[4]", className)}>
      {children}
    </motion.div>
  );
}

/* ---------- 1 · La carte ---------- */

export function IntroScene({ p }: SceneProps) {
  const opacity = useTransform(p, [0, 0.05, 0.085], [1, 1, 0]);
  const y = useTransform(p, [0, 0.085], [0, -24]);
  return (
    <motion.div style={{ opacity, y }} className="zone-top pointer-events-none z-[4]">
      <p className={label}>Dames du Parc</p>
      <h1 className="mt-3 font-display text-[clamp(34px,5.4vw,84px)] font-semibold uppercase leading-none tracking-[0.08em] text-white">Carte membre</h1>
    </motion.div>
  );
}

export function ScrollHint({ p }: SceneProps) {
  const opacity = useTransform(p, [0, 0.03, 0.06], [1, 1, 0]);
  return (
    <motion.div style={{ opacity }} className="zone-bottom pointer-events-none z-[4] flex flex-col items-center gap-3 font-body text-[11px] uppercase tracking-[0.3em] text-white/70">
      Faites défiler
      <span aria-hidden className="block h-9 w-px animate-pulse bg-gradient-to-b from-white/70 to-transparent" />
    </motion.div>
  );
}

export function StoryScene({ p }: SceneProps) {
  return (
    <Scene p={p} range={[0.075, 0.105, 0.175, 0.205]} className="zone-top">
      <p className="font-display text-[clamp(22px,3.2vw,46px)] font-semibold uppercase leading-[1.04] tracking-[0.06em] text-white">
        Une carte.
        <br />
        Une communauté.
      </p>
      <p className="mx-auto mt-3 max-w-md font-body text-[13px] leading-relaxed text-mist md:text-[15px]">Une saison au cœur du Paris Saint-Germain.</p>
    </Scene>
  );
}

/* ---------- 2 · Identité ---------- */

export function IdentityScene({ p, name, since, number, season }: SceneProps & { name: string; since: string; number: string; season: string }) {
  const nameEl = <p className="mt-3 font-display text-[clamp(24px,3.4vw,48px)] font-semibold uppercase leading-none tracking-[0.06em] text-white">{name}</p>;
  const seasonEl = <p className="mt-3 font-display text-[clamp(20px,2.6vw,36px)] font-semibold uppercase leading-none tracking-[0.06em] text-white">{season}</p>;
  return (
    <>
      <Scene p={p} range={[0.205, 0.235, 0.305, 0.33]} className="zone-left hidden md:block">
        <p className={label}>Votre carte</p>
        {nameEl}
        <p className="mt-3 font-body text-[15px] text-mist">Membre depuis {since}</p>
      </Scene>
      <Scene p={p} range={[0.215, 0.245, 0.305, 0.33]} className="zone-right hidden md:block">
        <p className={label}>Saison</p>
        {seasonEl}
        <p className="mt-3 font-body text-[15px] tabular-nums text-mist">N° {number}</p>
      </Scene>
      <Scene p={p} range={[0.205, 0.235, 0.305, 0.33]} className="zone-top md:hidden">
        <p className={label}>Votre carte</p>
        {nameEl}
        <p className="mt-2 font-body text-[13px] text-mist">Membre depuis {since}</p>
      </Scene>
      <Scene p={p} range={[0.215, 0.245, 0.305, 0.33]} className="zone-bottom md:hidden">
        <p className={label}>Saison</p>
        {seasonEl}
        <p className="mt-2 font-body text-[13px] tabular-nums text-mist">N° {number}</p>
      </Scene>
    </>
  );
}

/* ---------- 3 · Retournement ---------- */

export function FlipScene({ p }: SceneProps) {
  return (
    <Scene p={p} range={[0.345, 0.365, 0.395, 0.42]} className="zone-bottom">
      <p className="font-display text-[clamp(18px,2.4vw,34px)] font-semibold uppercase tracking-[0.1em] text-white">Deux faces. Un même engagement.</p>
    </Scene>
  );
}

/* ---------- 4 · Avantages : orbite qui ne croise jamais la carte ---------- */

const MOBILE_SLOTS = [
  { x: -22, y: -22 },
  { x: 22, y: -22 },
  { x: -22, y: 22 },
  { x: 22, y: 22 },
];

function Satellite({ p, desk, i }: SceneProps & { i: number }) {
  const item = benefits[i];
  const angle = useTransform(p, (v) => ((i * 90 - 90 + (v - 0.43) * 520) * Math.PI) / 180);
  const vis = useWindow(p, 0.43 + i * 0.005, 0.465 + i * 0.005, 0.545, 0.58);
  const x = useTransform([angle, desk], ([a, k]) => `${(k as number) ? Math.cos(a as number) * 36 : MOBILE_SLOTS[i].x}vw`);
  const y = useTransform([angle, desk], ([a, k]) => `${(k as number) ? Math.sin(a as number) * 30 : MOBILE_SLOTS[i].y}svh`);
  const depth = useTransform(angle, (a) => (Math.sin(a) + 1) / 2);
  const scale = useTransform([depth, desk], ([d, k]) => ((k as number) ? 0.86 + (d as number) * 0.14 : 1));
  return (
    <motion.div
      style={{ x, y, scale, opacity: vis, translate: "-50% -50%" }}
      className={cn("pointer-events-none absolute left-1/2 top-1/2 z-[3] w-[min(40vw,170px)] md:w-[min(15vw,220px)]", panel, "p-3 md:p-4")}
    >
      <p className="font-body text-[8.5px] font-semibold uppercase tracking-[0.2em] text-psg-red-bright md:text-[9.5px]">{item.kicker}</p>
      <p className="mt-1.5 font-display text-[clamp(16px,1.9vw,28px)] font-semibold uppercase leading-none tracking-[0.05em] text-white">{item.big}</p>
      <p className="mt-1.5 font-body text-[10.5px] text-mist md:text-[12px]">{item.sub}</p>
    </motion.div>
  );
}

export function BenefitsScene({ p, desk }: SceneProps) {
  return (
    <>
      {[0, 1, 2, 3].map((i) => (
        <Satellite key={i} p={p} desk={desk} i={i} />
      ))}
    </>
  );
}

/* ---------- 5 · Événements ---------- */

function AgendaItem({ p, i }: { p: MotionValue<number>; i: number }) {
  const item = agenda[i];
  const start = 0.6 + i * 0.011;
  const enter = useTransform(p, [start, start + 0.028], [0, 1], { clamp: true });
  const exit = useTransform(p, [0.685, 0.715], [1, 0]);
  const opacity = useTransform([enter, exit], ([a, b]) => (a as number) * (b as number));
  const x = useTransform(enter, (e) => `${(1 - e) * 5}vw`);
  return (
    <motion.li style={{ opacity, x }} className={cn(panel, "flex items-center gap-3 p-2.5 md:gap-5 md:p-4", i === 3 && "max-md:hidden")}>
      <span className="grid w-[46px] shrink-0 place-items-center border-r border-white/15 pr-3 text-center leading-none md:w-[54px] md:pr-4">
        <span className="font-display text-[22px] font-semibold tabular-nums text-white md:text-[30px]">{formatDay(item.date)}</span>
        <span className="mt-1 font-body text-[9px] font-semibold tracking-[0.2em] text-psg-red-bright md:text-[10px]">{formatMonthShort(item.date)}</span>
      </span>
      <span className="min-w-0 text-left">
        <span className="block font-body text-[9px] font-semibold uppercase tracking-[0.22em] text-mist">{item.tag}</span>
        <span className="mt-0.5 block font-body text-[12px] font-semibold leading-snug text-white md:text-[14px]">{item.title}</span>
      </span>
    </motion.li>
  );
}

function AgendaList({ p }: { p: MotionValue<number> }) {
  return (
    <ul className="flex flex-col gap-2 md:gap-3">
      {[0, 1, 2, 3].map((i) => (
        <AgendaItem key={i} p={p} i={i} />
      ))}
    </ul>
  );
}

export function AgendaScene({ p }: SceneProps) {
  return (
    <>
      <Scene p={p} range={[0.6, 0.625, 0.68, 0.71]} className="zone-left hidden md:block">
        <p className={label}>Prochains rendez-vous</p>
        <p className="mt-3 font-display text-[clamp(24px,3vw,44px)] font-semibold uppercase leading-[1.05] tracking-[0.06em] text-white">L&rsquo;agenda des membres</p>
        <p className="mt-3 font-body text-[15px] leading-relaxed text-mist">Matchs, soirées, rencontres : tout ce qui rythme la saison.</p>
      </Scene>
      <div className="zone-right pointer-events-none z-[4] hidden md:block">
        <AgendaList p={p} />
      </div>
      <div className="zone-bottom pointer-events-none z-[4] md:hidden">
        <AgendaList p={p} />
      </div>
    </>
  );
}

/* ---------- 6 · Newsletter ---------- */

function Fragment({ p, i }: { p: MotionValue<number>; i: number }) {
  const s = useScene(p, 0.72 + i * 0.008, 0.75 + i * 0.008, 0.785, 0.815);
  return (
    <motion.div style={{ opacity: s.opacity, y: s.y, filter: s.filter }} className={cn(panel, "pointer-events-none w-full max-w-[290px] p-3 text-left md:p-4")}>
      <p className="font-body text-[9px] font-semibold uppercase tracking-[0.22em] text-psg-red-bright">Newsletter</p>
      <p className="mt-1.5 font-body text-[12px] font-semibold leading-snug text-white md:text-[13.5px]">{newsletters[i]}</p>
    </motion.div>
  );
}

export function NewsletterScene({ p }: SceneProps) {
  return (
    <>
      <Scene p={p} range={[0.715, 0.745, 0.79, 0.815]} className="zone-top">
        <p className={label}>Newsletter</p>
        <p className="mt-2 font-display text-[clamp(24px,3.2vw,46px)] font-semibold uppercase tracking-[0.08em] text-white">Ne rate rien</p>
      </Scene>
      <div className="zone-left pointer-events-none z-[4] hidden flex-col items-end gap-4 md:flex">
        <Fragment p={p} i={0} />
        <Fragment p={p} i={2} />
      </div>
      <div className="zone-right pointer-events-none z-[4] hidden md:block">
        <Fragment p={p} i={1} />
      </div>
      <div className="zone-bottom pointer-events-none z-[4] flex flex-col items-center gap-2 md:hidden">
        <Fragment p={p} i={0} />
        <Fragment p={p} i={1} />
      </div>
    </>
  );
}

/* ---------- 7 · Carte virtuelle ---------- */

export function VirtualScene({ p }: SceneProps) {
  const caption = (
    <>
      <p className={label}>Carte virtuelle</p>
      <p className="mt-2 font-display text-[clamp(22px,2.8vw,42px)] font-semibold uppercase leading-[1.05] tracking-[0.08em] text-white">Ta carte, dans ta poche</p>
    </>
  );
  return (
    <>
      <Scene p={p} range={[0.815, 0.845, 0.895, 0.92]} className="zone-left hidden md:block">
        {caption}
      </Scene>
      <Scene p={p} range={[0.85, 0.875, 0.895, 0.92]} className="zone-right hidden md:block">
        <WalletButton />
      </Scene>
      <Scene p={p} range={[0.815, 0.845, 0.895, 0.92]} className="zone-top md:hidden">
        {caption}
      </Scene>
      <Scene p={p} range={[0.85, 0.875, 0.895, 0.92]} className="zone-bottom flex justify-center md:hidden">
        <WalletButton />
      </Scene>
    </>
  );
}

/* ---------- 8 · Communauté : cartes qui arrivent des bords et s'alignent sans toucher la carte ---------- */

const MINI_COUNT = 12;

function MiniCard({ p, desk, i }: SceneProps & { i: number }) {
  const left = i < 6;
  const j = i % 6;
  const dcol = j % 2;
  const drow = Math.floor(j / 2);
  const tx = left ? (dcol ? -29 : -40) : dcol ? 29 : 40;
  const ty = (drow - 1) * 16;
  const mx = ((i % 3) - 1) * 24;
  const my = i < 3 ? 21 : 30;
  const jx = (((i * 37) % 7) - 3) * 0.8;
  const jy = (((i * 53) % 7) - 3) * 1;
  const rot = ((i * 47) % 40) - 20;
  const spread = useTransform(p, [0.895, 0.93], [0, 1], { clamp: true });
  const gather = useTransform(p, [0.945, 0.965], [0, 1], { clamp: true });
  const vis = useWindow(p, 0.895, 0.912, 0.962, 0.978);
  const opacity = useTransform([vis, desk], ([v, k]) => ((k as number) || i < 6 ? (v as number) : 0));
  const x = useTransform([spread, gather, desk], ([s, g, k]) => {
    const target = (k as number) ? tx : mx;
    const from = (left ? -1 : 1) * 62 * ((k as number) ? 1 : 0) || (i % 2 ? 62 : -62);
    return `${from + (target + jx * (1 - (g as number)) - from) * (s as number)}vw`;
  });
  const y = useTransform([spread, gather, desk], ([s, g, k]) => `${((k as number) ? ty : my) + jy * (1 - (g as number)) * (s as number)}svh`);
  const rotate = useTransform([spread, gather], ([s, g]) => rot * (s as number) * (1 - (g as number)));
  return (
    <motion.div
      aria-hidden
      style={{ x, y, rotate, opacity, translate: "-50% -50%" }}
      className="pointer-events-none absolute left-1/2 top-1/2 z-[3] aspect-[1.6] w-[min(20vw,90px)] overflow-hidden rounded-[6px] border border-white/20 bg-[linear-gradient(135deg,#0e1c36,#04080f)] shadow-[0_18px_36px_-16px_rgba(0,0,0,0.9)] md:w-[min(9vw,120px)]"
    >
      <Image src="/logos/card-logo-color.webp" alt="" width={120} height={120} className="absolute left-1/2 top-[42%] w-[38%] -translate-x-1/2 -translate-y-1/2 rounded-full" draggable={false} />
      <span className={cn("absolute bottom-[14%] left-1/2 h-[2px] w-[28%] -translate-x-1/2", i % 3 === 0 ? "bg-psg-red" : "bg-white/30")} />
    </motion.div>
  );
}

export function CommunityScene({ p, desk }: SceneProps) {
  return (
    <>
      {Array.from({ length: MINI_COUNT }, (_, i) => (
        <MiniCard key={i} p={p} desk={desk} i={i} />
      ))}
      <Scene p={p} range={[0.925, 0.945, 0.96, 0.975]} className="zone-top">
        <p className="font-display text-[clamp(34px,6vw,96px)] font-semibold uppercase leading-none tracking-[0.06em] text-white">Dames du Parc</p>
        <p className="mt-3 font-body text-[12px] uppercase tracking-[0.3em] text-white/75 md:text-[13px]">Toutes réunies</p>
      </Scene>
    </>
  );
}

/* ---------- 9 · Prix ---------- */

function Price() {
  return (
    <p className="flex items-baseline justify-end gap-3 font-display font-semibold uppercase leading-none text-white max-md:justify-center">
      <span className="text-[clamp(44px,7vw,104px)] tracking-[0.02em]">{membership.price} €</span>
      <span className="font-body text-[12px] font-semibold tracking-[0.3em] text-mist md:text-[14px]">/ {membership.unit}</span>
    </p>
  );
}

function Cta() {
  return (
    <>
      <Button size="lg" href={membership.joinHref}>
        Devenir membre
      </Button>
      <p className="mt-4 font-body text-[13px] text-mist">
        Déjà membre ?{" "}
        <Link href={membership.loginHref} className="font-semibold text-white underline decoration-white/30 underline-offset-4 transition-colors hover:decoration-white">
          Se connecter
        </Link>
      </p>
    </>
  );
}

export function PriceScene({ p }: SceneProps) {
  const opacity = useTransform(p, [0.965, 0.988], [0, 1]);
  const y = useTransform(p, [0.965, 0.988], [30, 0]);
  const filter = useTransform(opacity, (v) => `blur(${(1 - v) * 9}px)`);
  const pointerEvents = useTransform(opacity, (v) => (v > 0.8 ? "auto" : "none")) as MotionValue<"auto" | "none">;
  const style = { opacity, y, filter, pointerEvents };
  return (
    <>
      <motion.div style={{ opacity, y, filter }} className="zone-top pointer-events-none z-[4]">
        <p className="font-display text-[clamp(18px,2.4vw,34px)] font-semibold uppercase leading-tight tracking-[0.14em] text-white">Une saison. Une communauté. Une carte.</p>
      </motion.div>
      <motion.div style={{ opacity, y, filter }} className="zone-left pointer-events-none z-[4] hidden md:block">
        <Price />
      </motion.div>
      <motion.div style={style} className="zone-right z-[4] hidden md:block">
        <Cta />
      </motion.div>
      <motion.div style={style} className="zone-bottom z-[4] md:hidden">
        <Price />
        <div className="mt-4">
          <Cta />
        </div>
      </motion.div>
    </>
  );
}
