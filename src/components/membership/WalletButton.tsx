"use client";

import { useEffect, useState } from "react";
import { Check, Plus } from "lucide-react";

type Phase = "idle" | "generating" | "ready" | "soon";

export function WalletButton() {
  const [phase, setPhase] = useState<Phase>("idle");

  useEffect(() => {
    if (phase !== "generating") return;
    const t = window.setTimeout(() => setPhase("ready"), 1700);
    return () => window.clearTimeout(t);
  }, [phase]);

  return (
    <div className="flex flex-col items-center gap-3 text-center">
      {phase === "idle" && (
        <button
          type="button"
          onClick={() => setPhase("generating")}
          className="group inline-flex min-h-12 items-center gap-3 rounded-full bg-white px-6 font-body text-[13px] font-semibold uppercase tracking-[0.08em] text-night-950 transition-transform duration-300 hover:-translate-y-0.5"
        >
          <Plus aria-hidden className="size-4 transition-transform duration-500 group-hover:rotate-90" strokeWidth={2.4} />
          Ajouter à Apple Wallet
        </button>
      )}
      {phase === "generating" && (
        <div role="status" className="flex min-h-12 flex-col items-center justify-center gap-2 font-body text-[12px] uppercase tracking-[0.18em] text-white/85">
          Génération de votre carte…
          <span className="relative block h-[2px] w-48 overflow-hidden rounded-full bg-white/20">
            <span className="absolute inset-0 origin-left animate-[wallet-load_1.7s_ease-in-out_forwards] bg-white" />
          </span>
        </div>
      )}
      {phase === "ready" && (
        <>
          <p role="status" className="flex items-center gap-2 font-body text-[12px] uppercase tracking-[0.18em] text-white/85">
            <Check aria-hidden className="size-4 text-psg-red-bright" /> Votre carte est prête.
          </p>
          <button
            type="button"
            onClick={() => setPhase("soon")}
            className="inline-flex min-h-12 items-center gap-3 rounded-full bg-black px-6 font-body text-[13px] font-semibold uppercase tracking-[0.08em] text-white ring-1 ring-white/40 transition-transform duration-300 hover:-translate-y-0.5"
          >
            Ajouter à Apple Wallet
          </button>
        </>
      )}
      {phase === "soon" && (
        <p role="status" className="max-w-xs font-body text-[12.5px] leading-relaxed text-mist">
          Le fichier Wallet (.pkpass) sera disponible à la mise en service : il nécessite un certificat Apple Developer.
        </p>
      )}
    </div>
  );
}
