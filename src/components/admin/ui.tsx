import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";

export const inp =
  "block h-10 w-full rounded-[8px] border border-white/[0.14] bg-[#0b1226] px-3 font-body text-[14px] text-white placeholder:text-white/35 focus:border-white/45 focus:outline-none disabled:opacity-50";
export const area = cn(inp, "h-auto min-h-[110px] py-2.5 leading-relaxed");
export const lbl = "font-body text-[12px] font-medium text-white/70";

export function PageHeader({ title, subtitle, actions, back }: { title: string; subtitle?: ReactNode; actions?: ReactNode; back?: { href: string; label: string } }) {
  return (
    <header className="mb-7 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {back && (
          <Link href={back.href} className="mb-2 inline-flex items-center gap-1.5 font-body text-[12.5px] text-white/60 hover:text-white">
            <ChevronLeft aria-hidden className="size-3.5" />
            {back.label}
          </Link>
        )}
        <h1 className="break-words font-display text-[clamp(26px,3vw,36px)] font-semibold uppercase leading-none tracking-[0.05em] text-white">{title}</h1>
        {subtitle && <p className="mt-2 max-w-[70ch] font-body text-[14px] text-mist">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}

export function Panel({ title, action, children, className, flush }: { title?: ReactNode; action?: ReactNode; children: ReactNode; className?: string; flush?: boolean }) {
  return (
    <section className={cn("min-w-0 rounded-[12px] border border-line bg-night-900/85", className)}>
      {(title || action) && (
        <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-3.5">
          {title && <h2 className="font-body text-[13px] font-semibold uppercase tracking-[0.14em] text-white/80">{title}</h2>}
          {action}
        </div>
      )}
      <div className={flush ? "" : "p-5"}>{children}</div>
    </section>
  );
}

export function Kpi({ label, value, hint, delta, href, tone }: { label: string; value: ReactNode; hint?: ReactNode; delta?: number; href?: string; tone?: "red" | "green" | "orange" }) {
  const inner = (
    <div className="flex h-full flex-col justify-between gap-3 p-5">
      <p className="font-body text-[11.5px] font-semibold uppercase tracking-[0.16em] text-mist">{label}</p>
      <p className={cn("font-display text-[clamp(30px,3vw,42px)] font-semibold leading-none tabular-nums text-white", tone === "red" && "text-[#ff8b9b]", tone === "green" && "text-emerald-300", tone === "orange" && "text-amber-300")}>{value}</p>
      <p className="flex items-center gap-2 font-body text-[12.5px] text-mist">
        {delta !== undefined && (
          <span className={cn("rounded-full px-2 py-0.5 text-[11.5px] font-semibold tabular-nums", delta >= 0 ? "bg-emerald-400/15 text-emerald-300" : "bg-psg-red/20 text-[#ff8b9b]")}>
            {delta >= 0 ? "+" : ""}
            {delta.toFixed(1).replace(".", ",")} %
          </span>
        )}
        {hint}
      </p>
    </div>
  );
  const cls = "block min-w-0 rounded-[12px] border border-line bg-night-900/85 transition-colors";
  return href ? (
    <Link href={href} className={cn(cls, "hover:border-white/30")}>
      {inner}
    </Link>
  ) : (
    <div className={cls}>{inner}</div>
  );
}

const tones = {
  green: "bg-emerald-400/15 text-emerald-300 border-emerald-400/25",
  red: "bg-psg-red/15 text-[#ff8b9b] border-psg-red/30",
  orange: "bg-amber-400/15 text-amber-300 border-amber-400/25",
  blue: "bg-sky-400/15 text-sky-300 border-sky-400/25",
  grey: "bg-white/[0.06] text-white/70 border-white/10",
} as const;
export type Tone = keyof typeof tones;

export function Badge({ tone = "grey", children }: { tone?: Tone; children: ReactNode }) {
  return <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-0.5 font-body text-[11.5px] font-semibold", tones[tone])}>{children}</span>;
}

export const Dot = ({ tone }: { tone: Tone }) => <span aria-hidden className={cn("size-1.5 rounded-full", { green: "bg-emerald-400", red: "bg-psg-red-bright", orange: "bg-amber-400", blue: "bg-sky-400", grey: "bg-white/40" }[tone])} />;

export function TableWrap({ children }: { children: ReactNode }) {
  return <div className="overflow-x-auto"><table className="w-full min-w-[720px] border-collapse text-left font-body text-[13.5px]">{children}</table></div>;
}
export const Th = ({ children, className }: { children?: ReactNode; className?: string }) => (
  <th scope="col" className={cn("whitespace-nowrap border-b border-line px-4 py-3 text-[11.5px] font-semibold uppercase tracking-[0.12em] text-mist", className)}>{children}</th>
);
export const Td = ({ children, className, colSpan }: { children?: ReactNode; className?: string; colSpan?: number }) => (
  <td colSpan={colSpan} className={cn("border-b border-white/[0.06] px-4 py-3 align-middle text-white/85", className)}>{children}</td>
);

export function Empty({ children }: { children: ReactNode }) {
  return <p className="px-5 py-10 text-center font-body text-[14px] text-mist">{children}</p>;
}

export function Pagination({ page, pages, hrefFor }: { page: number; pages: number; hrefFor: (p: number) => string }) {
  if (pages <= 1) return null;
  const btn = "inline-flex h-9 min-w-9 items-center justify-center rounded-[8px] border border-line px-3 font-body text-[13px] text-white/80 hover:border-white/30";
  return (
    <nav aria-label="Pagination" className="flex items-center justify-between gap-3 border-t border-line px-4 py-3">
      <p className="font-body text-[12.5px] text-mist">Page {page} sur {pages}</p>
      <div className="flex gap-2">
        {page > 1 && <Link href={hrefFor(page - 1)} className={btn} aria-label="Page précédente"><ChevronLeft aria-hidden className="size-4" /></Link>}
        {page < pages && <Link href={hrefFor(page + 1)} className={btn} aria-label="Page suivante"><ChevronRight aria-hidden className="size-4" /></Link>}
      </div>
    </nav>
  );
}

export const btn = {
  primary: "inline-flex h-10 items-center justify-center gap-2 rounded-[8px] border border-[#ff6b80]/45 bg-[linear-gradient(180deg,#e51b36,#b30d27)] px-4 font-body text-[13.5px] font-medium text-white hover:brightness-110 disabled:opacity-50",
  outline: "inline-flex h-10 items-center justify-center gap-2 rounded-[8px] border border-white/[0.16] bg-white/[0.03] px-4 font-body text-[13.5px] font-medium text-white hover:border-white/35 disabled:opacity-50",
  danger: "inline-flex h-10 items-center justify-center gap-2 rounded-[8px] border border-psg-red/50 bg-psg-red/10 px-4 font-body text-[13.5px] font-medium text-[#ff9aa8] hover:bg-psg-red/20 disabled:opacity-50",
  small: "inline-flex h-8 items-center justify-center gap-1.5 rounded-[7px] border border-white/[0.16] bg-white/[0.03] px-3 font-body text-[12.5px] font-medium text-white hover:border-white/35",
} as const;

export function LinkButton({ href, children, variant = "outline", className }: { href: string; children: ReactNode; variant?: "primary" | "outline" | "small"; className?: string }) {
  return <Link href={href} className={cn(btn[variant], className)}>{children}</Link>;
}

export function Field({ label, children, hint, className }: { label: string; children: ReactNode; hint?: string; className?: string }) {
  return (
    <label className={cn("block", className)}>
      <span className={lbl}>{label}</span>
      <span className="mt-1.5 block">{children}</span>
      {hint && <span className="mt-1 block font-body text-[11.5px] text-mist">{hint}</span>}
    </label>
  );
}

/** Message de retour après une action (?ok=… ou ?erreur=…). */
export function Flash({ ok, error }: { ok?: string; error?: string }) {
  if (!ok && !error) return null;
  return (
    <p role={error ? "alert" : "status"} className={cn("mb-6 rounded-[10px] border px-4 py-3 font-body text-[13.5px]", error ? "border-psg-red/40 bg-psg-red/10 text-[#ff9aa8]" : "border-emerald-400/30 bg-emerald-400/10 text-emerald-200")}>
      {error ?? ok}
    </p>
  );
}
