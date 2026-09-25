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

interface SceneProps {
  p: MotionValue<number>;
  desk: MotionValue<number>;
}

const label = "font-body text-[11px] font-semibold uppercase tracking-[0.3em] text-psg-red-bright md:text-[12px]";

/** Apparition / disparition avec flou et dérive verticale, pilotées par le scroll. */
function useScene(p: MotionValue<number>, a: number, b: number, c: number, d: number) {
  const opacity = useWindow(p, a, b, c, d);
  const y = useTransform(p, [a, b, c, d], [34, 0, 0, -34]);
  const filter = useTransform(opacity, (v) => `blur(${(1 - v) * 9}px)`);
  const pointerEvents = useTransform(opacity, (v) => (v > 0.6 ? "auto" : "none")) as MotionValue<"auto" | "none">;
  return { opacity, y, filter, pointerEvents };
}

function Scene({ p, range, className, children }: { p: MotionValue<number>; range: [number, number, number, number]; className?: string; children: ReactNode }) {
  const s = useScene(p, ...range);
  return (
    <motion.div style={s} className={cn("absolute z-[4]", className)}>
      {children}
    </motion.div>
  );
}

export function IntroScene({ p }: SceneProps) {
  const opacity = useTransform(p, [0, 0.05, 0.085], [1, 1, 0]);
  const y = useTransform(p, [0, 0.085], [0, -40]);
  return (
    <motion.div style={{ opacity, y }} className="pointer-events-none absolute inset-x-0 top-[13svh] z-[4] text-center">
      <p className={label}>Dames du Parc</p>
      <h1 className="mt-3 font-display text-[clamp(40px,7vw,104px)] font-semibold uppercase leading-none tracking-[0.08em] text-white">Carte membre</h1>
    </motion.div>
  );
}

export function ScrollHint({ p }: SceneProps) {
  const opacity = useTransform(p, [0, 0.03, 0.06], [1, 1, 0]);
  return (
    <motion.div style={{ opacity }} className="pointer-events-none absolute inset-x-0 bottom-[6svh] z-[4] flex flex-col items-center gap-3 font-body text-[11px] uppercase tracking-[0.3em] text-white/70">
      Faites défiler
      <span aria-hidden className="block h-9 w-px animate-pulse bg-gradient-to-b from-white/70 to-transparent" />
    </motion.div>
  );
}

export function StoryScene({ p }: SceneProps) {
  return (
    <Scene p={p} range={[0.075, 0.105, 0.175, 0.205]} className="inset-x-[var(--gutter)] top-[12svh] text-center">
      <p className="font-display text-[clamp(30px,5vw,68px)] font-semibold uppercase leading-[1.02] tracking-[0.06em] text-white">
        Une carte.
        <br />
        Une communauté.
      </p>
      <p className="mx-auto mt-4 max-w-md font-body text-[14px] leading-relaxed text-mist md:text-[16px]">Une saison au cœur du Paris Saint-Germain.</p>
    </Scene>
  );
}

export function IdentityScene({ p, name, since, number, season }: SceneProps & { name: string; since: string; number: string; season: string }) {
  return (
    <>
      <Scene p={p} range={[0.205, 0.235, 0.305, 0.33]} className="left-[var(--gutter)] top-[13svh] md:left-[6vw] md:top-1/2 md:-translate-y-1/2">
        <p className={label}>Votre carte</p>
        <p className="mt-3 font-display text-[clamp(30px,4.6vw,64px)] font-semibold uppercase leading-none tracking-[0.06em] text-white">{name}</p>
        <p className="mt-3 font-body text-[13px] text-mist md:text-[15px]">Membre depuis {since}</p>
      </Scene>
      <Scene p={p} range={[0.215, 0.245, 0.305, 0.33]} className="right-[var(--gutter)] top-[13svh] text-right md:right-[6vw] md:top-1/2 md:-translate-y-1/2">
        <p className={label}>Saison</p>
        <p className="mt-3 font-display text-[clamp(24px,3.4vw,46px)] font-semibold uppercase leading-none tracking-[0.06em] text-white">{season}</p>
        <p className="mt-3 font-body text-[13px] tabular-nums text-mist md:text-[15px]">N° {number}</p>
      </Scene>
    </>
  );
}

export function FlipScene({ p }: SceneProps) {
  return (
    <Scene p={p} range={[0.345, 0.365, 0.395, 0.42]} className="inset-x-[var(--gutter)] bottom-[9svh] text-center">
      <p className="font-display text-[clamp(22px,3vw,40px)] font-semibold uppercase tracking-[0.1em] text-white">Deux faces. Un même engagement.</p>
    </Scene>
  );
}

function Satellite({ p, desk, i }: SceneProps & { i: number }) {
  const item = benefits[i];
  const angle = useTransform(p, (v) => ((i * 90 - 90 + (v - 0.43) * 520) * Math.PI) / 180);
  const vis = useWindow(p, 0.43, 0.465, 0.545, 0.58);
  const x = useTransform([angle, desk], ([a, k]) => `${Math.cos(a as number) * ((k as number) ? 31 : 34)}vw`);
  const y = useTransform([angle, desk], ([a, k]) => `${Math.sin(a as number) * ((k as number) ? 26 : 34)}svh`);
  const depth = useTransform(angle, (a) => (Math.sin(a) + 1) / 2);
  const scale = useTransform(depth, (d) => 0.72 + d * 0.28);
  const opacity = useTransform([vis, depth], ([v, d]) => (v as number) * (0.5 + (d as number) * 0.5));
  const zIndex = useTransform(depth, (d) => (d > 0.5 ? 4 : 1));
  return (
    <motion.div style={{ x, y, scale, opacity, zIndex }} className="pointer-events-none absolute left-1/2 top-1/2 -ml-[min(19vw,120px)] -mt-[52px] w-[min(38vw,240px)] md:-ml-[120px]">
      <div className="rounded-[8px] border border-white/15 bg-[linear-gradient(135deg,rgba(14,28,54,0.96),rgba(4,9,20,0.96))] p-4 shadow-[0_24px_50px_-20px_rgba(0,0,0,0.9)] md:p-5">
        <p className="font-body text-[9.5px] font-semibold uppercase tracking-[0.22em] text-psg-red-bright md:text-[10.5px]">{item.kicker}</p>
        <p className="mt-2 font-display text-[clamp(20px,2.4vw,32px)] font-semibold uppercase leading-none tracking-[0.05em] text-white">{item.big}</p>
        <p className="mt-2 font-body text-[11.5px] text-mist md:text-[12.5px]">{item.sub}</p>
      </div>
    </motion.div>
  );
}

export function BenefitsScene({ p, desk }: SceneProps) {
  return (
    <>
      <Scene p={p} range={[0.43, 0.46, 0.55, 0.58]} className="inset-x-0 top-[11svh] text-center">
        <p className={label}>Avantages</p>
        <p className="mt-2 font-display text-[clamp(26px,3.6vw,50px)] font-semibold uppercase tracking-[0.08em] text-white">Ce que la carte ouvre</p>
      </Scene>
      {[0, 1, 2, 3].map((i) => (
        <Satellite key={i} p={p} desk={desk} i={i} />
      ))}
    </>
  );
}

function AgendaItem({ p, desk, i }: SceneProps & { i: number }) {
  const item = agenda[i];
  const start = 0.6 + i * 0.011;
  const enter = useTransform(p, [start, start + 0.028], [0, 1], { clamp: true });
  const exit = useTransform(p, [0.685, 0.715], [1, 0]);
  const opacity = useTransform([enter, exit], ([a, b]) => (a as number) * (b as number));
  const x = useTransform([enter, desk], ([e, k]) => `${(1 - (e as number)) * -28 * (k as number)}vw`);
  const y = useTransform([enter, desk], ([e, k]) => `${(1 - (e as number)) * -12 * (1 - (k as number))}svh`);
  const scale = useTransform(enter, (e) => 0.92 + e * 0.08);
  return (
    <motion.li style={{ opacity, x, y, scale }} className="flex items-center gap-4 rounded-[8px] border border-white/12 bg-[linear-gradient(135deg,rgba(14,28,54,0.96),rgba(4,9,20,0.96))] p-3 shadow-[0_20px_40px_-22px_rgba(0,0,0,0.9)] md:gap-5 md:p-4">
      <span className="grid w-[54px] shrink-0 place-items-center border-r border-white/15 pr-4 text-center leading-none">
        <span className="font-display text-[26px] font-semibold tabular-nums text-white md:text-[32px]">{formatDay(item.date)}</span>
        <span className="mt-1 font-body text-[10px] font-semibold tracking-[0.2em] text-psg-red-bright">{formatMonthShort(item.date)}</span>
      </span>
      <span className="min-w-0">
        <span className="block font-body text-[9.5px] font-semibold uppercase tracking-[0.22em] text-mist">{item.tag}</span>
        <span className="mt-1 block font-body text-[13px] font-semibold leading-snug text-white md:text-[15px]">{item.title}</span>
      </span>
    </motion.li>
  );
}

export function AgendaScene({ p, desk }: SceneProps) {
  const head = useScene(p, 0.6, 0.625, 0.68, 0.71);
  return (
    <div className="pointer-events-none absolute inset-x-[var(--gutter)] bottom-[3svh] z-[4] md:inset-x-auto md:bottom-auto md:right-[6vw] md:top-1/2 md:w-[min(34vw,470px)] md:-translate-y-1/2">
      <motion.p style={{ opacity: head.opacity, filter: head.filter }} className={cn(label, "mb-3 md:mb-4")}>
        Prochains rendez-vous
      </motion.p>
      <ul className="flex flex-col gap-2 md:gap-3">
        {[0, 1, 2, 3].map((i) => (
          <AgendaItem key={i} p={p} desk={desk} i={i} />
        ))}
      </ul>
    </div>
  );
}

function Fragment({ p, i, className }: { p: MotionValue<number>; i: number; className: string }) {
  const s = useScene(p, 0.72 + i * 0.008, 0.75 + i * 0.008, 0.785, 0.815);
  const drift = useTransform(p, [0.72, 0.82], [26 * (i % 2 ? -1 : 1), -26 * (i % 2 ? -1 : 1)]);
  const y = useTransform([s.y, drift], ([a, b]) => (a as number) + (b as number));
  return (
    <motion.div style={{ opacity: s.opacity, y, filter: s.filter }} className={cn("pointer-events-none absolute z-[4] w-[min(42vw,270px)] rounded-[8px] border border-white/12 bg-[linear-gradient(135deg,rgba(14,28,54,0.94),rgba(4,9,20,0.94))] p-3 md:p-4", className)}>
      <p className="font-body text-[9.5px] font-semibold uppercase tracking-[0.22em] text-psg-red-bright">Newsletter</p>
      <p className="mt-1.5 font-body text-[12px] font-semibold leading-snug text-white md:text-[13.5px]">{newsletters[i]}</p>
    </motion.div>
  );
}

export function NewsletterScene({ p }: SceneProps) {
  return (
    <>
      <Scene p={p} range={[0.715, 0.745, 0.79, 0.815]} className="inset-x-0 top-[11svh] text-center">
        <p className={label}>Newsletter</p>
        <p className="mt-2 font-display text-[clamp(26px,3.6vw,50px)] font-semibold uppercase tracking-[0.08em] text-white">Ne rate rien</p>
      </Scene>
      <Fragment p={p} i={0} className="left-[var(--gutter)] top-[64svh] md:left-[7vw] md:top-[26vh]" />
      <Fragment p={p} i={1} className="right-[var(--gutter)] top-[24svh] md:right-[7vw] md:top-[34vh]" />
      <Fragment p={p} i={2} className="bottom-[8svh] right-[var(--gutter)] md:bottom-[18vh] md:left-[10vw] md:right-auto" />
    </>
  );
}

export function VirtualScene({ p }: SceneProps) {
  return (
    <>
      <Scene p={p} range={[0.815, 0.845, 0.895, 0.92]} className="inset-x-0 top-[11svh] text-center md:top-[9svh]">
        <p className={label}>Carte virtuelle</p>
        <p className="mt-2 font-display text-[clamp(26px,3.6vw,48px)] font-semibold uppercase tracking-[0.08em] text-white">Ta carte, dans ta poche</p>
      </Scene>
      <Scene p={p} range={[0.85, 0.875, 0.895, 0.92]} className="inset-x-0 bottom-[9svh] flex justify-center md:bottom-[6svh]">
        <WalletButton />
      </Scene>
    </>
  );
}

const MINI_COUNT = 14;

function MiniCard({ p, i }: { p: MotionValue<number>; i: number }) {
  const a = (i * 137.508 * Math.PI) / 180;
  const rx = 16 + (i % 5) * 5.5;
  const ry = 14 + ((i * 3) % 5) * 5;
  const sx = Math.cos(a) * rx;
  const sy = Math.sin(a) * ry;
  const col = i % 7;
  const row = i < 7 ? -1 : 1;
  const gx = (col - 3) * 10.5;
  const gy = row * 17;
  const rot = ((i * 47) % 50) - 25;
  const spread = useTransform(p, [0.895, 0.93], [0, 1], { clamp: true });
  const gather = useTransform(p, [0.945, 0.965], [0, 1], { clamp: true });
  const vis = useWindow(p, 0.895, 0.912, 0.962, 0.978);
  const x = useTransform([spread, gather], ([s, g]) => `${(sx * (s as number)) * (1 - (g as number)) + gx * (g as number)}vw`);
  const y = useTransform([spread, gather], ([s, g]) => `${(sy * (s as number)) * (1 - (g as number)) + gy * (g as number)}svh`);
  const rotate = useTransform([spread, gather], ([s, g]) => rot * (s as number) * (1 - (g as number)));
  const scale = useTransform([spread, gather], ([s, g]) => (0.2 + 0.8 * (s as number)) * (1 - 0.1 * (g as number)));
  return (
    <motion.div
      aria-hidden
      style={{ x, y, rotate, scale, opacity: vis }}
      className="pointer-events-none absolute left-1/2 top-1/2 z-[1] -ml-[min(11vw,80px)] -mt-[min(6.9vw,50px)] aspect-[1.6] w-[min(22vw,160px)] overflow-hidden rounded-[6px] border border-white/20 bg-[linear-gradient(135deg,#0e1c36,#04080f)] shadow-[0_18px_36px_-16px_rgba(0,0,0,0.9)]"
    >
      <Image src="/logos/card-logo-color.webp" alt="" width={120} height={120} className="absolute left-1/2 top-[42%] w-[38%] -translate-x-1/2 -translate-y-1/2 rounded-full" draggable={false} />
      <span className={cn("absolute bottom-[14%] left-1/2 h-[2px] w-[28%] -translate-x-1/2", i % 3 === 0 ? "bg-psg-red" : "bg-white/30")} />
    </motion.div>
  );
}

export function CommunityScene({ p }: SceneProps) {
  const s = useScene(p, 0.925, 0.945, 0.96, 0.975);
  return (
    <>
      {Array.from({ length: MINI_COUNT }, (_, i) => (
        <MiniCard key={i} p={p} i={i} />
      ))}
      <motion.div style={{ opacity: s.opacity, filter: s.filter }} className="pointer-events-none absolute inset-x-0 top-1/2 z-[3] -translate-y-1/2 text-center">
        <p className="font-display text-[clamp(44px,11vw,190px)] font-semibold uppercase leading-none tracking-[0.06em] text-white [text-shadow:0_4px_50px_rgba(3,9,25,0.9)]">Dames du Parc</p>
        <p className="mt-3 font-body text-[13px] uppercase tracking-[0.3em] text-white/75 md:text-[14px]">Toutes réunies</p>
      </motion.div>
    </>
  );
}

export function PriceScene({ p }: SceneProps) {
  const opacity = useTransform(p, [0.965, 0.988], [0, 1]);
  const y = useTransform(p, [0.965, 0.988], [40, 0]);
  const filter = useTransform(opacity, (v) => `blur(${(1 - v) * 9}px)`);
  const pointerEvents = useTransform(opacity, (v) => (v > 0.8 ? "auto" : "none")) as MotionValue<"auto" | "none">;
  return (
    <>
      <motion.div style={{ opacity, y, filter }} className="pointer-events-none absolute inset-x-0 top-[11svh] z-[4] text-center">
        <p className="font-display text-[clamp(20px,2.8vw,38px)] font-semibold uppercase leading-tight tracking-[0.14em] text-white">
          Une saison. Une communauté. Une carte.
        </p>
      </motion.div>
      <motion.div style={{ opacity, y, filter, pointerEvents }} className="absolute inset-x-0 bottom-[5svh] z-[4] flex flex-col items-center text-center">
        <p className="flex items-baseline gap-3 font-display font-semibold uppercase leading-none text-white">
          <span className="text-[clamp(52px,7.5vw,104px)] tracking-[0.02em]">{membership.price} €</span>
          <span className="font-body text-[12px] font-semibold tracking-[0.3em] text-mist md:text-[14px]">/ {membership.unit}</span>
        </p>
        <div className="mt-4 md:mt-6">
          <Button size="lg" href={membership.joinHref}>
            Devenir membre
          </Button>
        </div>
        <p className="mt-4 font-body text-[13px] text-mist">
          Déjà membre ?{" "}
          <Link href={membership.loginHref} className="font-semibold text-white underline decoration-white/30 underline-offset-4 transition-colors hover:decoration-white">
            Se connecter
          </Link>
        </p>
      </motion.div>
    </>
  );
}
