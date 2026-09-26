"use client";

import { COUNTRIES } from "@/data/countries";
import { cn } from "@/lib/cn";

const CHEVRON = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23a9b4c8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")";

/** Liste de tous les pays (noms en français, drapeau). La valeur est le nom du pays. */
export function CountrySelect({ id, value, onChange, name, invalid, className, defaultValue }: { id: string; value?: string; defaultValue?: string; onChange?: (name: string) => void; name?: string; invalid?: boolean; className?: string }) {
  return (
    <select
      id={id}
      name={name}
      autoComplete="country-name"
      aria-invalid={invalid || undefined}
      {...(value !== undefined ? { value } : { defaultValue: defaultValue ?? "France" })}
      onChange={(e) => onChange?.(e.target.value)}
      style={{ backgroundImage: CHEVRON }}
      className={cn("flag mt-2 block h-12 w-full cursor-pointer appearance-none rounded-[10px] border border-white/[0.12] bg-[#0d1220] bg-[length:16px] bg-[position:right_12px_center] bg-no-repeat px-4 pr-10 font-body text-[15px] text-white transition-colors focus:border-white/40 focus:outline-none aria-[invalid=true]:border-psg-red-bright/70", className)}
    >
      {COUNTRIES.map((c) => (
        <option key={c.code} value={c.name}>{`${c.flag}  ${c.name}`}</option>
      ))}
    </select>
  );
}
