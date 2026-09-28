"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";

const MONTHS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
const WEEKDAYS = ["L", "M", "M", "J", "V", "S", "D"];
const MIN_YEAR = 1920;
const pad = (n: number | string) => String(n).padStart(2, "0");
const daysIn = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
const toIso = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`;
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

interface Ymd { y: number; m: number; d: number }

function parseIso(iso?: string): Ymd | null {
  const r = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso ?? "");
  if (!r) return null;
  const y = Number(r[1]), m = Number(r[2]) - 1, d = Number(r[3]);
  return m >= 0 && m < 12 && d >= 1 && d <= daysIn(y, m) ? { y, m, d } : null;
}

const todayYmd = (): Ymd => {
  const t = new Date();
  return { y: t.getFullYear(), m: t.getMonth(), d: t.getDate() };
};
const beforeOrEqualToday = (v: Ymd) => {
  const t = todayYmd();
  return v.y < t.y || (v.y === t.y && (v.m < t.m || (v.m === t.m && v.d <= t.d)));
};
const valid = (v: Ymd | null): v is Ymd => Boolean(v && v.y >= MIN_YEAR && beforeOrEqualToday(v));

/** « 14/03/1990 » saisi au clavier (les barres sont ajoutées automatiquement). */
const maskText = (raw: string) => {
  const digits = raw.replace(/\D/g, "").slice(0, 8);
  return [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4)].filter(Boolean).join("/");
};
const textToIso = (t: string): string => {
  const r = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(t);
  if (!r) return "";
  const v = { y: Number(r[3]), m: Number(r[2]) - 1, d: Number(r[1]) };
  return v.m >= 0 && v.m < 12 && v.d >= 1 && v.d <= daysIn(v.y, v.m) && valid(v) ? toIso(v.y, v.m, v.d) : "";
};
const isoToText = (iso?: string) => {
  const v = parseIso(iso);
  return v ? `${pad(v.d)}/${pad(v.m + 1)}/${v.y}` : "";
};

/**
 * Fenêtre de choix de la date aux couleurs du site : l'année en en-tête (un clic ouvre la liste des années), le jour choisi en grand,
 * la navigation de mois en mois et « Annuler » / « OK ». Ouverte sur la liste des années tant qu'aucune date n'est choisie.
 */
function DatePickerDialog({ value, onCancel, onOk }: { value: Ymd | null; onCancel: () => void; onOk: (v: Ymd) => void }) {
  const today = todayYmd();
  const [sel, setSel] = useState<Ymd | null>(value);
  const [view, setView] = useState<{ y: number; m: number }>(value ? { y: value.y, m: value.m } : { y: today.y - 25, m: 0 });
  const [mode, setMode] = useState<"day" | "year">(value ? "day" : "year");
  const dialog = useRef<HTMLDivElement>(null);
  const yearRef = useRef<HTMLButtonElement>(null);

  // Échap ferme ; Tab reste dans la fenêtre ; le focus part sur la date choisie (ou l'année).
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onCancel();
      }
      if (e.key === "Tab" && dialog.current) {
        const els = [...dialog.current.querySelectorAll<HTMLElement>("button:not([disabled])")];
        if (!els.length) return;
        const i = els.indexOf(document.activeElement as HTMLElement);
        if (e.shiftKey && i <= 0) {
          e.preventDefault();
          els[els.length - 1].focus();
        } else if (!e.shiftKey && i === els.length - 1) {
          e.preventDefault();
          els[0].focus();
        }
      }
    };
    document.addEventListener("keydown", onKey, true);
    const t = window.setTimeout(() => (dialog.current?.querySelector<HTMLElement>("[data-selected=true]") ?? yearRef.current)?.focus(), 30);
    return () => {
      document.removeEventListener("keydown", onKey, true);
      window.clearTimeout(t);
      prev?.focus?.();
    };
  }, [onCancel]);

  // La liste des années s'ouvre centrée sur l'année en cours de sélection.
  useEffect(() => {
    if (mode !== "year") return;
    dialog.current?.querySelector<HTMLElement>("[data-current-year=true]")?.scrollIntoView({ block: "center" });
  }, [mode]);

  const years = useMemo(() => Array.from({ length: today.y - MIN_YEAR + 1 }, (_, i) => today.y - i), [today.y]);
  const cells = useMemo(() => {
    const lead = (new Date(view.y, view.m, 1).getDay() + 6) % 7; // semaine commençant le lundi
    return [...Array<null>(lead).fill(null), ...Array.from({ length: daysIn(view.y, view.m) }, (_, i) => i + 1)];
  }, [view]);

  const canPrev = view.y > MIN_YEAR || view.m > 0;
  const canNext = view.y < today.y || view.m < today.m;
  const move = (delta: number) => {
    const d = new Date(view.y, view.m + delta, 1);
    setView({ y: d.getFullYear(), m: d.getMonth() });
  };
  const chooseYear = (y: number) => {
    const m = y === today.y && view.m > today.m ? today.m : view.m;
    setView({ y, m });
    if (sel) {
      const d = Math.min(sel.d, daysIn(y, sel.m));
      const next = { y, m: sel.m, d };
      setSel(beforeOrEqualToday(next) ? next : { y, m: today.m, d: Math.min(today.d, daysIn(y, today.m)) });
    }
    setMode("day");
  };

  const headDate = sel ? cap(new Date(sel.y, sel.m, sel.d).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" })) : "Choisir une date";

  return createPortal(
    <div className="fixed inset-0 z-[300] grid place-items-center bg-[#02040c]/80 px-4 backdrop-blur-sm" onMouseDown={(e) => e.target === e.currentTarget && onCancel()}>
      <div ref={dialog} role="dialog" aria-modal="true" aria-label="Choisir la date de naissance" className="w-full max-w-[360px] overflow-hidden rounded-[18px] border border-white/15 bg-[#0b1327] shadow-[0_40px_90px_-30px_rgba(0,0,0,0.95)]">
        <div className="bg-[linear-gradient(135deg,#123a86_0%,#0c2a66_60%,#2a1a4a_130%)] px-6 pb-5 pt-5">
          <button
            ref={yearRef}
            type="button"
            onClick={() => setMode(mode === "year" ? "day" : "year")}
            aria-label={`Année ${sel?.y ?? view.y}, choisir une autre année`}
            aria-pressed={mode === "year"}
            className={cn("rounded font-body text-[16px] font-medium transition-colors", mode === "year" ? "text-white" : "text-white/60 hover:text-white")}
          >
            {sel?.y ?? view.y}
          </button>
          <p aria-live="polite" className="mt-1 font-body text-[32px] font-semibold leading-[1.1] tracking-[-0.01em] text-white">{headDate}</p>
        </div>

        {mode === "year" ? (
          <div role="listbox" aria-label="Année" className="h-[312px] overflow-y-auto px-3 py-2 [scrollbar-width:thin]">
            {years.map((y) => {
              const on = y === (sel?.y ?? view.y);
              return (
                <button
                  key={y}
                  type="button"
                  role="option"
                  aria-selected={on}
                  data-current-year={on || undefined}
                  onClick={() => chooseYear(y)}
                  className={cn("mx-auto my-0.5 flex h-10 w-[120px] items-center justify-center rounded-full font-body tabular-nums transition-colors", on ? "bg-[#e51b36] text-[20px] font-semibold text-white" : "text-[16px] text-white/85 hover:bg-white/10")}
                >
                  {y}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="h-[312px] px-4 pb-2 pt-3">
            <div className="flex items-center justify-between">
              <button type="button" onClick={() => move(-1)} disabled={!canPrev} aria-label="Mois précédent" className="grid size-10 place-items-center rounded-full text-white transition-colors hover:bg-white/10 disabled:opacity-25">
                <ChevronLeft aria-hidden className="size-5" strokeWidth={2} />
              </button>
              <button type="button" onClick={() => setMode("year")} className="rounded px-2 font-body text-[15.5px] font-semibold text-white hover:text-white/80">
                {cap(MONTHS[view.m])} {view.y}
              </button>
              <button type="button" onClick={() => move(1)} disabled={!canNext} aria-label="Mois suivant" className="grid size-10 place-items-center rounded-full text-white transition-colors hover:bg-white/10 disabled:opacity-25">
                <ChevronRight aria-hidden className="size-5" strokeWidth={2} />
              </button>
            </div>
            <div className="mt-2 grid grid-cols-7 text-center font-body text-[12.5px] font-medium text-white/55" aria-hidden>
              {WEEKDAYS.map((w, i) => <span key={i} className="grid h-8 place-items-center">{w}</span>)}
            </div>
            <div className="grid grid-cols-7 gap-y-0.5">
              {cells.map((d, i) => {
                if (d === null) return <span key={`b${i}`} />;
                const cand = { y: view.y, m: view.m, d };
                const future = !beforeOrEqualToday(cand);
                const on = sel && sel.y === view.y && sel.m === view.m && sel.d === d;
                const isToday = today.y === view.y && today.m === view.m && today.d === d;
                return (
                  <button
                    key={d}
                    type="button"
                    disabled={future}
                    data-selected={on || undefined}
                    aria-pressed={Boolean(on)}
                    aria-label={new Date(view.y, view.m, d).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                    onClick={() => setSel(cand)}
                    className={cn(
                      "mx-auto grid size-10 place-items-center rounded-full font-body text-[14.5px] tabular-nums transition-colors disabled:opacity-25",
                      on ? "bg-[#e51b36] font-semibold text-white" : isToday ? "border border-white/40 text-white" : "text-white/90 hover:bg-white/10",
                    )}
                  >
                    {d}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2 border-t border-white/10 px-4 py-3">
          <button type="button" onClick={onCancel} className="min-h-11 rounded-[10px] px-4 font-body text-[13.5px] font-semibold uppercase tracking-[0.1em] text-white/80 hover:bg-white/10 hover:text-white">Annuler</button>
          <button type="button" disabled={!sel} onClick={() => sel && onOk(sel)} className="min-h-11 rounded-[10px] px-4 font-body text-[13.5px] font-semibold uppercase tracking-[0.1em] text-[#ff8b9b] hover:bg-white/10 disabled:opacity-35">OK</button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

/**
 * Date de naissance : saisie au clavier (JJ/MM/AAAA, barres ajoutées automatiquement) ou choix dans une fenêtre calendrier.
 * Valeur au format AAAA-MM-JJ ; vide tant que la date n'est pas complète et valable (jamais dans le futur).
 */
export function BirthDateInput({ id, value, onChange, invalid, describedBy, name, className }: { id: string; value?: string; onChange?: (iso: string) => void; invalid?: boolean; describedBy?: string; name?: string; className?: string }) {
  const [text, setText] = useState(() => isoToText(value));
  const [iso, setIso] = useState(() => (parseIso(value) ? (value as string) : ""));
  const [open, setOpen] = useState(false);
  const opener = useRef<HTMLButtonElement>(null);

  // Resynchronise si la valeur est modifiée de l'extérieur (réinitialisation du formulaire).
  useEffect(() => {
    if (value === undefined) return;
    if (value !== iso) {
      if (parseIso(value)) {
        setIso(value);
        setText(isoToText(value));
      } else if (value === "") {
        setIso("");
        setText("");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  function commit(nextText: string) {
    const nextIso = textToIso(nextText);
    setText(nextText);
    setIso(nextIso);
    onChange?.(nextIso);
  }

  return (
    <div id={id} role="group" aria-label="Date de naissance" className={cn("mt-2 flex gap-2", className)}>
      <input
        type="text"
        inputMode="numeric"
        autoComplete="bday"
        placeholder="JJ/MM/AAAA"
        maxLength={10}
        value={text}
        onChange={(e) => commit(maskText(e.target.value))}
        aria-label="Date de naissance (jour, mois, année)"
        aria-invalid={invalid || (text.length === 10 && !iso) || undefined}
        aria-describedby={describedBy}
        className="block h-12 min-w-0 flex-1 rounded-[10px] border border-white/[0.12] bg-[#0d1220] px-3.5 font-body text-[15px] tabular-nums text-white placeholder:text-white/35 transition-colors focus:border-white/40 focus:outline-none aria-[invalid=true]:border-psg-red-bright/70"
      />
      <button
        ref={opener}
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Ouvrir le calendrier"
        aria-haspopup="dialog"
        className="grid size-12 shrink-0 place-items-center rounded-[10px] border border-white/[0.12] bg-[#0d1220] text-white/85 transition-colors hover:border-white/40 hover:text-white"
      >
        <CalendarDays aria-hidden className="size-5" strokeWidth={1.7} />
      </button>
      {open && (
        <DatePickerDialog
          value={parseIso(iso)}
          onCancel={() => setOpen(false)}
          onOk={(v) => {
            commit(`${pad(v.d)}/${pad(v.m + 1)}/${v.y}`);
            setOpen(false);
          }}
        />
      )}
      {name && <input type="hidden" name={name} value={iso} />}
    </div>
  );
}
