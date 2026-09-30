"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, Home } from "lucide-react";
import type { ErrorPage } from "@/data/errors";

/**
 * Page d'erreur aux couleurs du site : photo du Parc en fond, code en grand, message, bouton « Retour » (page précédente) et bouton
 * « Accueil ». La photo est celle choisie dans l'administration (Site internet > Pages d'erreur).
 */
export function ErrorScreen({ page, photo, fetchPhoto = false, digest }: { page: ErrorPage; photo?: string; fetchPhoto?: boolean; digest?: string }) {
  const [src, setSrc] = useState(photo || page.photo);
  useEffect(() => {
    if (!fetchPhoto) return;
    let live = true;
    fetch("/api/error-photos")
      .then((r) => (r.ok ? (r.json() as Promise<Record<string, string>>) : ({} as Record<string, string>)))
      .then((m) => live && m[page.slug] && setSrc(m[page.slug]))
      .catch(() => undefined);
    return () => {
      live = false;
    };
  }, [fetchPhoto, page.slug]);

  const back = () => {
    if (window.history.length > 1) window.history.back();
    else window.location.href = "/";
  };

  return (
    <main className="relative isolate flex min-h-[100svh] items-center overflow-hidden bg-night-950 px-[var(--gutter)] pb-32 pt-[150px] md:pt-[170px]">
      <Image src={src} alt="" fill priority sizes="100vw" unoptimized={src.startsWith("/medias/") || src.startsWith("http")} className="-z-20 object-cover opacity-45 saturate-[0.8]" />
      <div aria-hidden className="absolute inset-0 -z-10 bg-[linear-gradient(0deg,rgba(3,9,25,0.96)_0%,rgba(3,9,25,0.7)_45%,rgba(3,9,25,0.55)_100%),linear-gradient(90deg,rgba(3,9,25,0.85)_0%,rgba(3,9,25,0.2)_70%)]" />
      <div className="mx-auto flex w-full max-w-[1100px] flex-col items-center text-center">
        <p className="font-display text-[clamp(64px,16vw,190px)] uppercase leading-[0.9] text-transparent [-webkit-text-stroke:2px_rgba(240,22,52,0.9)]" aria-hidden>{page.code}</p>
        <h1 className="mt-4 max-w-[20ch] font-display text-[clamp(26px,5vw,58px)] uppercase leading-[1.04] tracking-[0.01em] text-white">{page.title}</h1>
        <p className="mt-6 max-w-[52ch] font-body text-[16px] leading-[1.75] text-white/85">{page.text}</p>
        {digest && <p className="mt-3 font-body text-[12.5px] text-white/50">Référence : {digest}</p>}
        <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <button type="button" onClick={back} className="inline-flex min-h-[54px] items-center justify-center gap-3 rounded-[10px] border border-white/25 bg-[#121417]/90 px-7 font-body text-[15.5px] font-medium text-white hover:border-white/50">
            <ArrowLeft aria-hidden className="size-5" /> Retour
          </button>
          <Link href="/" className="inline-flex min-h-[54px] items-center justify-center gap-3 rounded-[10px] border border-[#ff6b80]/45 bg-[linear-gradient(180deg,#e51b36_0%,#b30d27_100%)] px-7 font-body text-[15.5px] font-medium text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.22),0_12px_30px_-14px_rgba(217,15,44,0.85)] hover:brightness-110">
            <Home aria-hidden className="size-5" /> Page d’accueil
          </Link>
        </div>
      </div>
    </main>
  );
}
