"use client";

import { useEffect, useId, useRef, useState } from "react";
import { CountrySelect } from "./CountrySelect";
import { cn } from "@/lib/cn";

export interface Locality {
  postalCode: string;
  city: string;
  country: string;
}
interface Suggestion {
  city: string;
  postalCode: string;
  department: string;
}

const STYLES = {
  public: {
    label: "font-body text-[12.5px] font-medium text-white/80",
    input: "mt-2 block h-12 w-full rounded-[10px] border border-white/[0.12] bg-[#0d1220] px-4 font-body text-[15px] text-white placeholder:text-white/35 transition-colors focus:border-white/40 focus:outline-none aria-[invalid=true]:border-psg-red-bright/70",
    error: "mt-1.5 font-body text-[12.5px] text-[#ff8b9b]",
  },
  admin: {
    label: "block font-body text-[12px] font-medium uppercase tracking-[0.14em] text-mist",
    input: "mt-1.5 block h-11 w-full rounded-[10px] border border-white/[0.14] bg-white/[0.04] px-3.5 font-body text-[14px] text-white focus:border-white/40 focus:outline-none",
    error: "mt-1 font-body text-[12px] text-[#ff9aa8]",
  },
} as const;

/** Suggestions de communes (code postal ou nom) tant que le pays est la France. */
function useCommunes(query: string, active: boolean) {
  const [items, setItems] = useState<Suggestion[]>([]);
  useEffect(() => {
    const q = query.trim();
    if (!active || q.length < 2) {
      setItems([]);
      return;
    }
    const ctl = new AbortController();
    const t = setTimeout(() => {
      fetch(`/api/geo/communes?q=${encodeURIComponent(q)}`, { signal: ctl.signal })
        .then((r) => (r.ok ? r.json() : []))
        .then((d: Suggestion[]) => setItems(Array.isArray(d) ? d : []))
        .catch(() => undefined);
    }, 140);
    return () => {
      clearTimeout(t);
      ctl.abort();
    };
  }, [query, active]);
  return items;
}

function Suggest({ id, items, active, onPick }: { id: string; items: Suggestion[]; active: number; onPick: (s: Suggestion) => void }) {
  if (!items.length) return null;
  return (
    <ul id={id} role="listbox" className="absolute left-0 right-0 top-full z-40 mt-1 max-h-[260px] overflow-y-auto overscroll-contain rounded-[12px] border border-white/[0.14] bg-[#0b1020] py-1 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.95)]">
      {items.map((s, i) => (
        <li key={`${s.city}-${s.postalCode}`} role="option" aria-selected={i === active}>
          <button
            type="button"
            tabIndex={-1}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onPick(s)}
            className={cn("flex min-h-11 w-full items-center justify-between gap-3 px-4 text-left font-body text-[14px] text-white/90 hover:bg-white/[0.07]", i === active && "bg-white/[0.09]")}
          >
            <span className="min-w-0 truncate">{s.city}</span>
            <span className="shrink-0 tabular-nums text-mist">{s.postalCode} · {s.department}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}

/**
 * Code postal, ville et pays d'une adresse. Pour la France (toutes les communes, outre-mer compris) :
 * le code postal choisi complète la ville, la ville choisie complète le code postal. Autres pays : saisie libre.
 * Renvoie trois blocs (à placer dans une grille) : pays, code postal, ville (le pays d'abord).
 */
export function LocalityFields({ ids, value, onChange, errors = {}, variant = "public", names }: { ids: { postalCode: string; city: string; country: string }; value: Locality; onChange: (patch: Partial<Locality>) => void; errors?: Partial<Record<keyof Locality, string>>; variant?: "public" | "admin"; names?: { postalCode: string; city: string; country: string } }) {
  const st = STYLES[variant];
  const france = !value.country || value.country === "France";
  const uid = useId();
  const [focus, setFocus] = useState<"postal" | "city" | null>(null);
  const [cursor, setCursor] = useState(-1);
  const postalItems = useCommunes(/^\d{2,5}$/.test(value.postalCode) ? value.postalCode : "", france);
  const cityItems = useCommunes(value.city, france);
  const skipCity = useRef("");

  // Code postal complet et sans ambiguïté : la ville est complétée toute seule.
  useEffect(() => {
    if (!france || !/^\d{5}$/.test(value.postalCode)) return;
    const exact = postalItems.filter((s) => s.postalCode === value.postalCode);
    if (exact.length === 1 && exact[0].city !== value.city && !value.city) onChange({ city: exact[0].city });
  }, [postalItems]); // eslint-disable-line react-hooks/exhaustive-deps

  const pick = (s: Suggestion) => {
    skipCity.current = s.city;
    onChange({ postalCode: s.postalCode, city: s.city });
    setFocus(null);
    setCursor(-1);
  };
  const items = focus === "postal" ? postalItems : focus === "city" && skipCity.current !== value.city ? cityItems : [];
  const onKey = (e: React.KeyboardEvent) => {
    if (!items.length) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setCursor((c) => (c + 1) % items.length); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setCursor((c) => (c <= 0 ? items.length - 1 : c - 1)); }
    else if (e.key === "Enter" && cursor >= 0) { e.preventDefault(); pick(items[cursor]); }
    else if (e.key === "Escape") setFocus(null);
  };
  const combo = (kind: "postal" | "city") => ({
    role: france ? ("combobox" as const) : undefined,
    "aria-expanded": france ? focus === kind && items.length > 0 : undefined,
    "aria-controls": france ? `${uid}-${kind}` : undefined,
    "aria-autocomplete": france ? ("list" as const) : undefined,
    onFocus: () => { setFocus(kind); setCursor(-1); },
    onBlur: () => setTimeout(() => setFocus((f) => (f === kind ? null : f)), 120),
    onKeyDown: onKey,
  });

  return (
    <>
      <div className="sm:col-span-2">
        <label htmlFor={ids.country} className={st.label}>Pays</label>
        <CountrySelect
          id={ids.country}
          name={names?.country}
          value={value.country || "France"}
          invalid={Boolean(errors.country)}
          onChange={(country) => onChange({ country, ...(country !== "France" && france ? { postalCode: "", city: "" } : {}) })}
          className={variant === "admin" ? "mt-1.5 h-11 rounded-[10px] border-white/[0.14] bg-white/[0.04] text-[14px]" : undefined}
        />
        {errors.country && <p role="alert" className={st.error}>{errors.country}</p>}
      </div>
      <div className="relative">
        <label htmlFor={ids.postalCode} className={st.label}>Code postal</label>
        <input
          id={ids.postalCode}
          name={names?.postalCode}
          autoComplete="postal-code"
          inputMode={france ? "numeric" : "text"}
          maxLength={france ? 5 : 10}
          value={value.postalCode}
          aria-invalid={Boolean(errors.postalCode) || undefined}
          onChange={(e) => { setCursor(-1); onChange({ postalCode: france ? e.target.value.replace(/\D/g, "").slice(0, 5) : e.target.value }); }}
          className={st.input}
          {...combo("postal")}
        />
        {france && focus === "postal" && <Suggest id={`${uid}-postal`} items={postalItems} active={cursor} onPick={pick} />}
        {errors.postalCode && <p role="alert" className={st.error}>{errors.postalCode}</p>}
      </div>
      <div className="relative">
        <label htmlFor={ids.city} className={st.label}>Ville</label>
        <input
          id={ids.city}
          name={names?.city}
          autoComplete="address-level2"
          value={value.city}
          aria-invalid={Boolean(errors.city) || undefined}
          onChange={(e) => { setCursor(-1); skipCity.current = ""; onChange({ city: e.target.value }); }}
          className={st.input}
          {...combo("city")}
        />
        {france && focus === "city" && skipCity.current !== value.city && <Suggest id={`${uid}-city`} items={cityItems} active={cursor} onPick={pick} />}
        {errors.city && <p role="alert" className={st.error}>{errors.city}</p>}
      </div>
    </>
  );
}
