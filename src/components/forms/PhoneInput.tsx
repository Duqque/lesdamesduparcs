"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import { PHONE_COUNTRIES, FRANCE, type Country } from "@/data/countries";
import { cn } from "@/lib/cn";

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

const digitsOf = (v: string) => v.replace(/\D/g, "");
const BY_LENGTH = [...PHONE_COUNTRIES].sort((a, b) => b.dial.length - a.dial.length);

/** Retrouve le pays d'un numéro « +33 6 12… » (indicatif le plus long qui correspond) ; sans indicatif : France. */
function parse(value: string): { country: Country; national: string } {
  const v = value.trim();
  if (v.startsWith("+")) {
    const all = `+${digitsOf(v)}`;
    const match = BY_LENGTH.find((c) => all.startsWith(c.dial));
    if (match) return { country: match, national: all.slice(match.dial.length) };
  }
  return { country: FRANCE, national: digitsOf(v).replace(/^0/, "") };
}

/** Numéro complet lisible : « +33 6 12 34 56 78 » (France), sinon par groupes de trois chiffres. */
function format(country: Country, national: string) {
  let digits = digitsOf(national);
  if (country.code === "FR") digits = digits.replace(/^0+/, "");
  if (!digits) return "";
  const grouped = country.code === "FR" ? `${digits.slice(0, 1)} ${(digits.slice(1).match(/\d{1,2}/g) ?? []).join(" ")}`.trim() : (digits.match(/\d{1,3}/g) ?? []).join(" ");
  return `${country.dial} ${grouped}`;
}

/**
 * Téléphone international : liste de tous les pays (drapeau + indicatif, avec recherche) et numéro national.
 * La valeur émise est complète (« +33 6 12 34 56 78 »). Avec `name`, la valeur est aussi envoyée par le formulaire.
 */
export function PhoneInput({ id, value, defaultValue, onChange, name, invalid, describedBy, required, placeholder, className, size = "md" }: { size?: "md" | "sm"; id: string; value?: string; defaultValue?: string; onChange?: (full: string) => void; name?: string; invalid?: boolean; describedBy?: string; required?: boolean; placeholder?: string; className?: string }) {
  const initial = useMemo(() => parse(value ?? defaultValue ?? ""), []); // eslint-disable-line react-hooks/exhaustive-deps
  const [country, setCountry] = useState<Country>(initial.country);
  const [national, setNational] = useState(initial.national);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const wrap = useRef<HTMLDivElement>(null);
  const listId = useId();

  useEffect(() => {
    if (value === undefined) return;
    if (value === "" && format(country, national) !== "") setNational("");
    else if (value && value !== format(country, national)) {
      const p = parse(value);
      setCountry(p.country);
      setNational(p.national);
    }
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => !wrap.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const full = format(country, national);
  const emit = (c: Country, n: string) => onChange?.(format(c, n));
  const q = norm(query);
  const shown = q ? PHONE_COUNTRIES.filter((c) => norm(c.name).includes(q) || c.dial.includes(q.replace(/^\+?/, "+")) || c.code.toLowerCase() === q) : PHONE_COUNTRIES;

  const sm = size === "sm";
  return (
    <div ref={wrap} className={cn("relative flex", sm ? "gap-1.5" : "mt-2 gap-2", className)}>
      {sm ? (
        // Version compacte (petites fenêtres) : sélecteur natif superposé, sans fenêtre flottante.
        <span className="relative flex h-7 shrink-0 items-center gap-1 rounded-[8px] border border-white/[0.14] bg-white/[0.05] px-2 font-body text-[13px] text-white">
          <span className="flag text-[15px] leading-none" aria-hidden>{country.flag}</span>
          <span className="tabular-nums">{country.dial}</span>
          <select
            aria-label="Pays et indicatif"
            value={country.code}
            onChange={(e) => {
              const c = PHONE_COUNTRIES.find((x) => x.code === e.target.value) ?? FRANCE;
              setCountry(c);
              emit(c, national);
            }}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          >
            {PHONE_COUNTRIES.map((c) => <option key={c.code} value={c.code}>{`${c.flag} ${c.name} (${c.dial})`}</option>)}
          </select>
        </span>
      ) : (
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={`Indicatif : ${country.name} ${country.dial}`}
        onClick={() => { setOpen((v) => !v); setQuery(""); }}
        className="flex h-12 shrink-0 items-center gap-1.5 rounded-[10px] border border-white/[0.12] bg-[#0d1220] px-3 font-body text-[15px] text-white transition-colors hover:border-white/30 focus:border-white/40 focus:outline-none"
      >
        <span className="flag text-[20px] leading-none" aria-hidden>{country.flag}</span>
        <span className="tabular-nums text-white/90">{country.dial}</span>
        <ChevronDown aria-hidden className="size-4 text-mist" />
      </button>
      )}
      <input
        id={id}
        type="tel"
        inputMode="tel"
        autoComplete="tel-national"
        required={required}
        value={national}
        placeholder={placeholder ?? (country.code === "FR" ? "6 12 34 56 78" : "Numéro")}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        onChange={(e) => {
          const raw = e.target.value;
          // Numéro collé avec son indicatif (« +33 6… » ou « 0033… ») : le pays est détecté.
          if (/^\s*(\+|00)/.test(raw)) {
            const p = parse(raw.replace(/^\s*00/, "+"));
            setCountry(p.country);
            setNational(p.national);
            emit(p.country, p.national);
            return;
          }
          setNational(raw);
          emit(country, raw);
        }}
        className={cn("block min-w-0 flex-1 border font-body text-white placeholder:text-white/35 transition-colors focus:border-white/40 focus:outline-none aria-[invalid=true]:border-psg-red-bright/70", sm ? "h-7 rounded-[8px] border-white/[0.14] bg-white/[0.05] px-2.5 text-[12.5px]" : "h-12 rounded-[10px] border-white/[0.12] bg-[#0d1220] px-4 text-[15px]")}
      />
      {name && <input type="hidden" name={name} value={full} />}
      {!sm && open && (
        <div className="absolute left-0 top-[calc(100%+6px)] z-50 w-[min(340px,100%)] min-w-[280px] overflow-hidden rounded-[12px] border border-white/[0.14] bg-[#0b1020] shadow-[0_24px_60px_-20px_rgba(0,0,0,0.95)]">
          <div className="flex items-center gap-2 border-b border-white/10 px-3">
            <Search aria-hidden className="size-4 text-mist" />
            <input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher un pays ou un indicatif" aria-label="Rechercher un pays" className="h-11 w-full bg-transparent font-body text-[14px] text-white placeholder:text-white/40 focus:outline-none" />
          </div>
          <ul id={listId} role="listbox" aria-label="Pays" className="max-h-[260px] overflow-y-auto overscroll-contain py-1">
            {shown.length === 0 && <li className="px-4 py-3 font-body text-[13.5px] text-mist">Aucun pays trouvé.</li>}
            {shown.map((c) => (
              <li key={c.code} role="option" aria-selected={c.code === country.code}>
                <button
                  type="button"
                  onClick={() => { setCountry(c); setOpen(false); emit(c, national); }}
                  className={cn("flex min-h-11 w-full items-center gap-3 px-4 text-left font-body text-[14px] text-white/90 transition-colors hover:bg-white/[0.07]", c.code === country.code && "bg-white/[0.06]")}
                >
                  <span className="flag text-[20px] leading-none" aria-hidden>{c.flag}</span>
                  <span className="min-w-0 flex-1 truncate">{c.name}</span>
                  <span className="tabular-nums text-mist">{c.dial}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
