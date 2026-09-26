"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";

const MONTHS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
const daysIn = (y: number, m: number) => new Date(y || 2000, m, 0).getDate();
const pad = (n: number | string) => String(n).padStart(2, "0");

const selectCls = "block h-12 w-full cursor-pointer appearance-none rounded-[10px] border border-white/[0.12] bg-[#0d1220] bg-[length:16px] bg-[position:right_12px_center] bg-no-repeat px-3.5 pr-9 font-body text-[15px] text-white transition-colors focus:border-white/40 focus:outline-none aria-[invalid=true]:border-psg-red-bright/70";
const CHEVRON = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23a9b4c8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")";

/**
 * Sélecteur de date de naissance : trois listes (jour, mois, année), fiables sur mobile où le champ « date » natif déborde.
 * Valeur au format AAAA-MM-JJ ; vide tant que les trois listes ne sont pas renseignées.
 */
export function BirthDateInput({ id, value, onChange, invalid, describedBy, name, className }: { id: string; value?: string; onChange?: (iso: string) => void; invalid?: boolean; describedBy?: string; name?: string; className?: string }) {
  const [parts, setParts] = useState(() => {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value ?? "");
    return { y: m?.[1] ?? "", m: m ? String(Number(m[2])) : "", d: m ? String(Number(m[3])) : "" };
  });
  // Resynchronise si la valeur est modifiée de l'extérieur (réinitialisation du formulaire).
  useEffect(() => {
    if (value === undefined) return;
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (m) setParts({ y: m[1], m: String(Number(m[2])), d: String(Number(m[3])) });
    else if (value === "") setParts((p) => (p.y && p.m && p.d ? { y: "", m: "", d: "" } : p));
  }, [value]);

  const thisYear = new Date().getFullYear();
  const years = Array.from({ length: thisYear - 1919 }, (_, i) => thisYear - i);
  const maxDay = parts.m ? daysIn(Number(parts.y), Number(parts.m)) : 31;
  const iso = parts.y && parts.m && parts.d ? `${parts.y}-${pad(parts.m)}-${pad(Math.min(Number(parts.d), maxDay))}` : "";

  function update(next: Partial<typeof parts>) {
    const p = { ...parts, ...next };
    if (p.m && p.d && Number(p.d) > daysIn(Number(p.y), Number(p.m))) p.d = String(daysIn(Number(p.y), Number(p.m)));
    setParts(p);
    onChange?.(p.y && p.m && p.d ? `${p.y}-${pad(p.m)}-${pad(p.d)}` : "");
  }
  const style = { backgroundImage: CHEVRON };
  const common = { "aria-invalid": invalid || undefined, "aria-describedby": describedBy, style } as const;

  return (
    <div id={id} role="group" aria-label="Date de naissance" className={cn("mt-2 grid grid-cols-[minmax(0,0.8fr)_minmax(0,1.5fr)_minmax(0,1fr)] gap-2", className)}>
      <select aria-label="Jour" autoComplete="bday-day" value={parts.d} onChange={(e) => update({ d: e.target.value })} className={selectCls} {...common}>
        <option value="">Jour</option>
        {Array.from({ length: maxDay }, (_, i) => i + 1).map((d) => <option key={d} value={d}>{d}</option>)}
      </select>
      <select aria-label="Mois" autoComplete="bday-month" value={parts.m} onChange={(e) => update({ m: e.target.value })} className={selectCls} {...common}>
        <option value="">Mois</option>
        {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
      </select>
      <select aria-label="Année" autoComplete="bday-year" value={parts.y} onChange={(e) => update({ y: e.target.value })} className={selectCls} {...common}>
        <option value="">Année</option>
        {years.map((y) => <option key={y} value={y}>{y}</option>)}
      </select>
      {name && <input type="hidden" name={name} value={iso} />}
    </div>
  );
}
