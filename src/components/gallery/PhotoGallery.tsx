"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Camera, ChevronLeft, ChevronRight, X } from "lucide-react";
import { CardLabel } from "@/components/ui/CardLabel";
import { Reveal } from "@/components/ui/Reveal";
import { cn } from "@/lib/cn";
import type { GalleryPhoto } from "@/data/gallery";

const compactSpan = (i: number) =>
  i === 0 ? "col-span-2 md:col-span-6 md:row-span-2" : i >= 3 ? "max-md:hidden md:col-span-3" : "md:col-span-3";

/** `compact` : deux rangées seulement (accueil). Les photos au-delà des cinq premières sont ignorées par l'appelant. */
export function PhotoGallery({ photos, compact = false }: { photos: GalleryPhoto[]; compact?: boolean }) {
  const [open, setOpen] = useState<number | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const opener = useRef<HTMLElement | null>(null);

  const close = useCallback(() => {
    setOpen(null);
    opener.current?.focus();
  }, []);
  const step = useCallback((d: number) => setOpen((i) => (i === null ? i : (i + d + photos.length) % photos.length)), [photos.length]);

  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowRight") step(1);
      else if (e.key === "ArrowLeft") step(-1);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, close, step]);

  const active = open === null ? null : photos[open];

  return (
    <section aria-labelledby="gallery-title" className="mx-auto max-w-[1800px] px-[var(--gutter)] pb-28 pt-28 md:pt-40 xl:pr-[clamp(32px,3.4vw,72px)]">
      <div className="mb-12 flex items-end justify-between gap-4">
        <div>
          <CardLabel icon={Camera}>Galerie</CardLabel>
          <h2 id="gallery-title" className="mt-3 t-h2">
            Le Parc en images
          </h2>
        </div>
        <p className="hidden max-w-xs text-right font-body text-[13px] leading-relaxed text-mist md:block">Tribunes, fumigènes, drapeaux : la passion parisienne, du Parc à l&rsquo;Europe.</p>
      </div>

      <ul className="grid auto-rows-[170px] grid-flow-dense grid-cols-2 gap-4 md:auto-rows-[200px] md:grid-cols-12 md:gap-6 xl:auto-rows-[240px]">
        {photos.map((photo, i) => (
          <li key={photo.id} className={cn("min-h-0", compact ? compactSpan(i) : photo.span)}>
            <Reveal className="h-full" delay={(i % 4) * 0.05}>
              <button
                type="button"
                data-cursor="view"
                onClick={(e) => {
                  opener.current = e.currentTarget;
                  setOpen(i);
                }}
                aria-label={`Agrandir : ${photo.caption}`}
                className="group relative block size-full overflow-hidden rounded-[6px] border border-line bg-night-900"
              >
                <Image
                  src={photo.src}
                  alt={photo.alt}
                  fill
                  sizes="(min-width: 1280px) 50vw, (min-width: 768px) 50vw, 100vw"
                  className="object-cover transition-transform duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04]"
                />
                <span aria-hidden className="absolute inset-0 bg-[linear-gradient(180deg,transparent_50%,rgba(3,9,25,0.85)_100%)] opacity-80 transition-opacity duration-500 group-hover:opacity-100" />
                <span className="absolute inset-x-0 bottom-0 flex translate-y-1 items-center gap-2 p-3 text-left font-body text-[12.5px] font-semibold text-white transition-transform duration-500 group-hover:translate-y-0">
                  <span aria-hidden className="h-[2px] w-5 shrink-0 origin-left scale-x-50 bg-psg-red transition-transform duration-500 group-hover:scale-x-100" />
                  {photo.caption}
                </span>
              </button>
            </Reveal>
          </li>
        ))}
      </ul>

      <AnimatePresence>
        {active && (
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={active.caption}
            className="fixed inset-0 z-[80] flex flex-col bg-night-950/95 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={close}
          >
            <div className="flex items-center justify-between px-[var(--gutter)] py-4" onClick={(e) => e.stopPropagation()}>
              <p className="font-body text-[13px] font-semibold text-white">
                {active.caption} <span className="ml-2 text-mist">{(open ?? 0) + 1} / {photos.length}</span>
              </p>
              <button ref={closeRef} type="button" onClick={close} aria-label="Fermer" className="grid size-11 place-items-center rounded-full text-white hover:bg-white/10">
                <X aria-hidden className="size-6" />
              </button>
            </div>
            <div className="relative flex-1" onClick={(e) => e.stopPropagation()}>
              <Image key={active.id} src={active.src} alt={active.alt} fill sizes="100vw" className="object-contain p-2 md:p-8" priority />
              <button type="button" onClick={() => step(-1)} aria-label="Photo précédente" className="absolute left-2 top-1/2 grid size-12 -translate-y-1/2 place-items-center rounded-full bg-night-950/70 text-white hover:bg-night-800 md:left-6">
                <ChevronLeft aria-hidden className="size-6" />
              </button>
              <button type="button" onClick={() => step(1)} aria-label="Photo suivante" className="absolute right-2 top-1/2 grid size-12 -translate-y-1/2 place-items-center rounded-full bg-night-950/70 text-white hover:bg-night-800 md:right-6">
                <ChevronRight aria-hidden className="size-6" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
