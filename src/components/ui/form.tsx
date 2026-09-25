import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export const inputCls =
  "mt-2 block h-12 w-full rounded-[10px] border border-white/[0.12] bg-[#0d1220] px-4 font-body text-[15px] text-white placeholder:text-white/35 transition-colors focus:border-white/40 focus:outline-none aria-[invalid=true]:border-psg-red-bright/70 read-only:text-white/60";
export const textareaCls = cn(inputCls, "h-auto min-h-[96px] py-3 leading-relaxed");

export function Field({ id, label, error, hint, className, children }: { id: string; label: string; error?: string; hint?: string; className?: string; children: ReactNode }) {
  return (
    <div className={className}>
      <label htmlFor={id} className="font-body text-[12.5px] font-medium text-white/80">
        {label}
      </label>
      {children}
      {hint && !error && <p className="mt-1.5 font-body text-[12px] text-mist">{hint}</p>}
      {error && (
        <p id={`${id}-err`} role="alert" className="mt-1.5 font-body text-[12.5px] text-[#ff8b9b]">
          {error}
        </p>
      )}
    </div>
  );
}

export function Check({ id, checked, onChange, error, children }: { id: string; checked: boolean; onChange: (v: boolean) => void; error?: string; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="flex cursor-pointer items-start gap-3 font-body text-[14px] leading-[1.6] text-white/85">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          aria-invalid={Boolean(error)}
          className="mt-1 size-[18px] shrink-0 cursor-pointer rounded-[4px] border border-white/30 bg-[#0d1220] accent-[#d90f2c]"
        />
        <span>{children}</span>
      </label>
      {error && (
        <p role="alert" className="mt-1.5 pl-[30px] font-body text-[12.5px] text-[#ff8b9b]">
          {error}
        </p>
      )}
    </div>
  );
}
