"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Play, X, ZoomIn } from "lucide-react";
import { cn } from "@/lib/cn";

interface Media {
  src: string;
  kind: "image" | "video";
}

/**
 * Galerie du produit : photos (et vidéos) en miniatures, et une fenêtre plein écran (clic sur une photo) pour zoomer, naviguer avec les
 * flèches du clavier ou de l'écran, agrandir jusqu'à 250 % et déplacer l'image. Échap ferme la fenêtre.
 */
export function ProductGallery({ name, images, videos = [], isNew }: { name: string; images: string[]; videos?: string[]; isNew?: boolean }) {
  const media: Media[] = [...images.map((src) => ({ src, kind: "image" as const })), ...videos.map((src) => ({ src, kind: "video" as const }))];
  const [current, setCurrent] = useState(0);
  const [open, setOpen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [pos, setPos] = useState({ x: 50, y: 50 });

  const go = useCallback((d: number) => {
    setCurrent((c) => (c + d + media.length) % media.length);
    setZoom(1);
    setPos({ x: 50, y: 50 });
  }, [media.length]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, go]);

  const main = media[current];
  const zoomStep = () => setZoom((z) => (z >= 2.5 ? 1 : z + 0.75));

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-[1fr_88px] sm:grid-flow-dense">
        <button type="button" onClick={() => setOpen(true)} aria-label={`Agrandir la photo de ${name}`} className="group relative aspect-[3/4] cursor-zoom-in overflow-hidden rounded-[22px] bg-[#e9ebee] text-left sm:col-start-1">
          {main.kind === "image" ? (
            <Image src={main.src} alt={name} fill priority sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover object-top" />
          ) : (
            <video src={main.src} muted playsInline className="size-full object-cover" />
          )}
          {isNew && <span className="absolute left-4 top-4 rounded-full bg-night-950 px-3.5 py-1.5 font-display text-[12px] font-semibold uppercase tracking-[0.12em] text-white">Nouveau</span>}
          <span aria-hidden className="absolute bottom-4 right-4 grid size-11 place-items-center rounded-full bg-night-950/80 text-white opacity-90 transition-opacity group-hover:opacity-100"><ZoomIn className="size-5" strokeWidth={1.7} /></span>
        </button>
        <ul className="flex gap-3 sm:col-start-2 sm:flex-col">
          {media.map((m, i) => (
            <li key={m.src}>
              <button type="button" onClick={() => setCurrent(i)} aria-label={`Voir le média ${i + 1}`} aria-current={i === current} className={cn("relative block aspect-[3/4] w-20 overflow-hidden rounded-[10px] bg-[#e9ebee] ring-1 sm:w-full", i === current ? "ring-2 ring-psg-red-bright" : "ring-white/20 hover:ring-white/50")}>
                {m.kind === "image" ? <Image src={m.src} alt={`${name}, vue ${i + 1}`} fill sizes="88px" className="object-cover object-top" /> : <><video src={m.src} muted className="size-full object-cover" /><span className="absolute inset-0 grid place-items-center bg-black/35 text-white"><Play aria-hidden className="size-5" /></span></>}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {open && (
        <div role="dialog" aria-modal="true" aria-label={`Galerie : ${name}`} className="fixed inset-0 z-[250] flex flex-col bg-[#02040c]/95 backdrop-blur-sm" onMouseDown={(e) => e.target === e.currentTarget && setOpen(false)}>
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <p className="min-w-0 truncate font-body text-[14px] text-white/85">{name} · {current + 1} / {media.length}</p>
            <div className="flex items-center gap-2">
              {main.kind === "image" && <button type="button" onClick={zoomStep} aria-label="Zoomer" className="grid size-11 place-items-center rounded-full border border-white/20 text-white hover:border-white/50"><ZoomIn aria-hidden className="size-5" /></button>}
              <button type="button" onClick={() => setOpen(false)} aria-label="Fermer la galerie" className="grid size-11 place-items-center rounded-full border border-white/20 text-white hover:border-white/50"><X aria-hidden className="size-5" /></button>
            </div>
          </div>
          <div className="relative min-h-0 flex-1" onMouseDown={(e) => e.target === e.currentTarget && setOpen(false)}>
            {main.kind === "image" ? (
              <div
                className={cn("absolute inset-0 overflow-hidden", zoom > 1 ? "cursor-zoom-out" : "cursor-zoom-in")}
                onClick={zoomStep}
                onMouseMove={(e) => {
                  if (zoom <= 1) return;
                  const r = e.currentTarget.getBoundingClientRect();
                  setPos({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={main.src} alt={name} draggable={false} className="size-full select-none object-contain transition-transform duration-200" style={{ transform: `scale(${zoom})`, transformOrigin: `${pos.x}% ${pos.y}%` }} />
              </div>
            ) : (
              <video key={main.src} src={main.src} controls autoPlay playsInline className="absolute inset-0 size-full object-contain" />
            )}
            {media.length > 1 && (
              <>
                <button type="button" onClick={() => go(-1)} aria-label="Média précédent" className="absolute left-3 top-1/2 grid size-12 -translate-y-1/2 place-items-center rounded-full border border-white/25 bg-night-950/70 text-white hover:border-white/60"><ChevronLeft aria-hidden className="size-6" /></button>
                <button type="button" onClick={() => go(1)} aria-label="Média suivant" className="absolute right-3 top-1/2 grid size-12 -translate-y-1/2 place-items-center rounded-full border border-white/25 bg-night-950/70 text-white hover:border-white/60"><ChevronRight aria-hidden className="size-6" /></button>
              </>
            )}
          </div>
          <ul className="flex justify-center gap-2 overflow-x-auto px-4 py-3">
            {media.map((m, i) => (
              <li key={m.src}>
                <button type="button" onClick={() => { setCurrent(i); setZoom(1); }} aria-label={`Voir le média ${i + 1}`} className={cn("relative block h-16 w-12 overflow-hidden rounded-[8px] ring-1", i === current ? "ring-2 ring-psg-red-bright" : "ring-white/20")}>
                  {m.kind === "image" ? <Image src={m.src} alt="" fill sizes="48px" className="object-cover" /> : <video src={m.src} muted className="size-full object-cover" />}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}
