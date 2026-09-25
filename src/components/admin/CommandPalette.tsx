"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";

interface Hit {
  type: string;
  title: string;
  sub?: string;
  href: string;
}

/** Recherche globale (⌘K / Ctrl+K) : adhérentes, événements, transactions, articles. */
export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  const [busy, setBusy] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => input.current?.focus(), 20);
  }, [open]);

  useEffect(() => {
    if (q.trim().length < 2) return;
    const t = setTimeout(async () => {
      setBusy(true);
      try {
        const res = await fetch(`/api/admin/search?q=${encodeURIComponent(q)}`, { cache: "no-store" });
        setHits(res.ok ? ((await res.json()) as Hit[]) : []);
      } finally {
        setBusy(false);
      }
    }, 180);
    return () => clearTimeout(t);
  }, [q]);

  const shown = q.trim().length < 2 ? [] : hits;

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="flex h-10 min-w-0 items-center gap-2.5 rounded-[8px] border border-line bg-night-900/70 px-3 font-body text-[13.5px] text-mist hover:border-white/30 md:w-[320px]">
        <Search aria-hidden className="size-4 shrink-0" />
        <span className="hidden flex-1 text-left md:block">Rechercher</span>
        <kbd className="ml-auto hidden rounded border border-white/15 px-1.5 py-0.5 font-body text-[11px] text-white/60 md:block">⌘ K</kbd>
      </button>
      {open && (
        <div role="dialog" aria-modal="true" aria-label="Recherche" className="fixed inset-0 z-[60] grid place-items-start bg-black/70 px-4 pt-[12vh]" onClick={() => setOpen(false)}>
          <div className="mx-auto w-full max-w-[620px] overflow-hidden rounded-[14px] border border-white/15 bg-night-900 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 border-b border-line px-4">
              <Search aria-hidden className="size-4 text-mist" />
              <input ref={input} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Marie Dupont, PSG Marseille, paiement…" className="h-14 flex-1 bg-transparent font-body text-[15px] text-white placeholder:text-white/35 focus:outline-none" />
              <span className="font-body text-[11px] text-mist">{busy ? "…" : "Échap"}</span>
            </div>
            <ul className="max-h-[50vh] overflow-y-auto p-2">
              {shown.length === 0 && <li className="px-3 py-6 text-center font-body text-[13.5px] text-mist">{q.trim().length < 2 ? "Tapez au moins 2 caractères." : busy ? "Recherche…" : "Aucun résultat."}</li>}
              {shown.map((h, i) => (
                <li key={`${h.href}-${i}`}>
                  <Link href={h.href} onClick={() => setOpen(false)} className="flex items-center gap-3 rounded-[8px] px-3 py-2.5 hover:bg-white/[0.06]">
                    <span className="w-[86px] shrink-0 font-body text-[10.5px] font-semibold uppercase tracking-[0.14em] text-psg-red-bright">{h.type}</span>
                    <span className="min-w-0">
                      <span className="block truncate font-body text-[14px] text-white">{h.title}</span>
                      {h.sub && <span className="block truncate font-body text-[12px] text-mist">{h.sub}</span>}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
