"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { RotateCw } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useIntroDone } from "@/lib/intro";

const BASE = { rx: 8, ry: -10, rz: -2 };
const MAX_RX = 10;
const MAX_RY = 15;
const EDGE_LAYERS = [-1.65, -1.1, -0.55, 0, 0.55, 1.1, 1.65];

const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max);
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

export function MembershipCard({ memberNumber }: { memberNumber: string }) {
  const reduce = useReducedMotion();
  const introDone = useIntroDone();
  const boxRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const shadowRef = useRef<HTMLDivElement>(null);
  const flipRef = useRef(false);
  const [flipped, setFlipped] = useState(false);

  const toggleFlip = () => {
    flipRef.current = !flipRef.current;
    setFlipped(flipRef.current);
  };

  useEffect(() => {
    const box = boxRef.current;
    const card = cardRef.current;
    const shadow = shadowRef.current;
    if (!box || !card || !shadow) return;

    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const cur = { rx: BASE.rx, ry: BASE.ry, rz: BASE.rz, lx: 50, ly: 40, hov: 0, flip: flipRef.current ? 180 : 0 };
    const tgt = { rx: BASE.rx, ry: BASE.ry, lx: 50, ly: 40, hov: 0 };
    let raf = 0;
    let visible = true;

    const apply = (t: number) => {
      const float = still ? 0 : Math.sin((t * 2 * Math.PI) / 7) * 6;
      const wx = still ? 0 : Math.sin((t * 2 * Math.PI) / 9) * 0.5;
      const wy = still ? 0 : Math.cos((t * 2 * Math.PI) / 11) * 0.6;
      const wz = still ? 0 : Math.sin((t * 2 * Math.PI) / 13) * 0.4;
      const scale = 1 + cur.hov * 0.02;
      const z = cur.hov * 20;
      card.style.transform = `translate3d(0, ${float}px, ${z}px) rotateX(${cur.rx + wx}deg) rotateZ(${cur.rz + wz}deg) rotateY(${cur.ry + wy + cur.flip}deg) scale(${scale})`;
      card.style.setProperty("--lx", `${cur.lx}%`);
      card.style.setProperty("--lxb", `${100 - cur.lx}%`);
      card.style.setProperty("--ly", `${cur.ly}%`);
      card.style.setProperty("--li", `${0.11 + cur.hov * 0.07}`);

      const down = (float + 6) / 12;
      const tilt = cur.ry - BASE.ry;
      shadow.style.transform = `translate3d(${-tilt * 1.4}px, 0, 0) scale(${0.84 + down * 0.14 + cur.hov * 0.03}, ${0.8 + down * 0.25})`;
      shadow.style.opacity = `${0.34 + down * 0.24 + cur.hov * 0.08}`;
      shadow.style.filter = `blur(${26 - down * 12}px)`;
    };

    const onMove = (e: PointerEvent) => {
      const r = box.getBoundingClientRect();
      const dx = clamp((e.clientX - (r.left + r.width / 2)) / (window.innerWidth * 0.5), -1, 1);
      const dy = clamp((e.clientY - (r.top + r.height / 2)) / (window.innerHeight * 0.5), -1, 1);
      tgt.ry = BASE.ry + dx * MAX_RY;
      tgt.rx = BASE.rx - dy * MAX_RX;
      tgt.lx = 50 - dx * 45;
      tgt.ly = 42 - dy * 38;
      tgt.hov = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom ? 1 : 0;
    };
    const onLeave = () => {
      tgt.rx = BASE.rx;
      tgt.ry = BASE.ry;
      tgt.lx = 50;
      tgt.ly = 40;
      tgt.hov = 0;
    };

    if (still) {
      apply(0);
      return;
    }

    const tick = (now: number) => {
      if (visible) {
        cur.rx = lerp(cur.rx, tgt.rx, 0.08);
        cur.ry = lerp(cur.ry, tgt.ry, 0.08);
        cur.lx = lerp(cur.lx, tgt.lx, 0.08);
        cur.ly = lerp(cur.ly, tgt.ly, 0.08);
        cur.hov = lerp(cur.hov, tgt.hov, 0.09);
        cur.flip = lerp(cur.flip, flipRef.current ? 180 : 0, 0.085);
        apply(now / 1000);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
    });
    io.observe(box);
    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  useEffect(() => {
    const card = cardRef.current;
    if (!card || !window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    card.style.transform = `rotateX(${BASE.rx}deg) rotateZ(${BASE.rz}deg) rotateY(${BASE.ry + (flipped ? 180 : 0)}deg)`;
  }, [flipped]);

  return (
    <div className="flex flex-col items-center">
      <motion.div
        className="w-full"
        style={{ transformPerspective: 1400 }}
        initial={reduce ? false : { opacity: 0, y: 50, rotateX: 20, rotateY: -20, scale: 0.92 }}
        animate={introDone ? { opacity: 1, y: 0, rotateX: 0, rotateY: 0, scale: 1 } : undefined}
        transition={{ duration: 1.3, ease: [0.16, 1, 0.3, 1] }}
      >
        <div
          ref={boxRef}
          className="relative mx-auto aspect-[1.6] w-[min(88vw,680px)] cursor-pointer select-none [container-type:inline-size] [perspective:1300px]"
          onClick={toggleFlip}
          data-cursor="view"
        >
          <div
            ref={shadowRef}
            aria-hidden
            className="pointer-events-none absolute inset-x-[10%] -bottom-[8%] h-[10%] rounded-[50%] bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0.85),transparent_70%)]"
          />
          <div
            ref={cardRef}
            role="img"
            aria-label={flipped ? "Carte membre des Dames du Parc, verso" : "Carte membre des Dames du Parc, recto"}
            className="absolute inset-0 [transform-style:preserve-3d]"
            style={{ transform: `rotateX(${BASE.rx}deg) rotateZ(${BASE.rz}deg) rotateY(${BASE.ry}deg)` }}
          >
            {EDGE_LAYERS.map((z) => (
              <div
                key={z}
                aria-hidden
                className="card-radius absolute inset-0 border border-white/25 bg-[#0a1220]"
                style={{ transform: `translateZ(${z}px)` }}
              />
            ))}

            <div className="card3d-face absolute inset-0 [transform-style:preserve-3d]" style={{ transform: "translateZ(2px)" }}>
              <div className="card-radius absolute inset-0 overflow-hidden bg-[linear-gradient(135deg,#0e1c36_0%,#070f1f_38%,#03070f_100%)] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.22),inset_0_1px_0_rgba(255,255,255,0.55)]">
                <div
                  aria-hidden
                  className="absolute inset-0 bg-[linear-gradient(115deg,transparent_18%,rgba(140,170,220,0.13)_30%,transparent_42%),linear-gradient(115deg,transparent_58%,rgba(120,150,210,0.09)_70%,transparent_78%)]"
                />
                <div aria-hidden className="card3d-spec absolute inset-0" />
              </div>
              <Image
                src="/logos/card-logo-color.webp"
                alt=""
                width={480}
                height={480}
                sizes="(min-width: 768px) 260px, 34vw"
                priority
                className="absolute left-1/2 top-[41%] w-[36.5cqw] -translate-x-1/2 -translate-y-1/2 rounded-full drop-shadow-[0_1.2cqw_1.6cqw_rgba(0,0,0,0.55)]"
                style={{ transform: "translateZ(16px)" }}
                draggable={false}
              />
              <p
                className="absolute inset-x-0 top-[80%] -translate-y-1/2 text-center font-body text-[3cqw] font-light uppercase tracking-[0.42em] text-white/90"
                style={{ transform: "translateZ(10px)" }}
              >
                Les Dames du Parc
              </p>
              <span
                aria-hidden
                className="absolute left-1/2 top-[88%] h-[0.28cqw] w-[20cqw] -translate-x-1/2 bg-[linear-gradient(90deg,transparent,#e5142f,transparent)] shadow-[0_0_1.4cqw_rgba(229,20,47,0.6)]"
                style={{ transform: "translateZ(6px)" }}
              />
            </div>

            <div className="card3d-face absolute inset-0 [transform-style:preserve-3d]" style={{ transform: "rotateY(180deg) translateZ(2px)" }}>
              <div className="card-radius absolute inset-0 overflow-hidden bg-[linear-gradient(120deg,#12213b_0%,#08111f_36%,#03070f_100%)] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.22),inset_0_1px_0_rgba(255,255,255,0.55)]">
                <div aria-hidden className="absolute inset-0 bg-[linear-gradient(105deg,rgba(150,180,230,0.28)_0%,transparent_34%)]" />
                <div aria-hidden className="absolute inset-x-0 top-[11.5%] h-[19%] bg-[#030406] shadow-[0_0_0_1px_rgba(255,255,255,0.03)]" />
                <div aria-hidden className="card3d-spec-back absolute inset-0" />
              </div>
              <Image
                src="/logos/card-logo-silver.webp"
                alt=""
                width={400}
                height={400}
                sizes="180px"
                className="absolute left-1/2 top-[69%] w-[20cqw] -translate-x-1/2 -translate-y-1/2 rounded-full"
                style={{ transform: "translateZ(12px)" }}
                draggable={false}
              />
              <p
                className="absolute right-[4.2%] top-[54%] -translate-y-1/2 font-body text-[2.4cqw] font-light uppercase whitespace-nowrap tracking-[0.38em] text-white/85 [writing-mode:vertical-rl]"
                style={{ transform: "translateZ(8px)" }}
              >
                N° Membre {memberNumber}
              </p>
              <p
                className="absolute inset-x-0 top-[91%] -translate-y-1/2 text-center font-body text-[2.1cqw] font-light lowercase tracking-[0.3em] text-white/85"
                style={{ transform: "translateZ(8px)" }}
              >
                www.lesdamesduparc.fr
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      <button
        type="button"
        onClick={toggleFlip}
        className="group mt-14 inline-flex min-h-11 items-center gap-2.5 font-body text-[12px] font-semibold uppercase tracking-[0.18em] text-white/80 transition-colors hover:text-white md:mt-20"
      >
        <RotateCw aria-hidden className="size-4 transition-transform duration-500 group-hover:rotate-180" />
        {flipped ? "Voir le recto" : "Voir le verso"}
      </button>
    </div>
  );
}
