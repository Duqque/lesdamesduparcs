"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";
import { cn } from "@/lib/cn";

interface Alert {
  level: "urgent" | "important" | "info";
  text: string;
  href: string;
}

const dot = { urgent: "bg-psg-red-bright", important: "bg-amber-400", info: "bg-emerald-400" } as const;
const label = { urgent: "Urgente", important: "Importante", info: "Information" } as const;

export function NotificationBell() {
  const [items, setItems] = useState<Alert[]>([]);
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let live = true;
    const load = () =>
      fetch("/api/admin/notifications", { cache: "no-store" })
        .then((r) => (r.ok ? (r.json() as Promise<Alert[]>) : []))
        .then((d) => live && setItems(d))
        .catch(() => undefined);
    load();
    const t = setInterval(load, 60_000);
    return () => {
      live = false;
      clearInterval(t);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!box.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const urgent = items.filter((i) => i.level === "urgent").length;
  return (
    <div ref={box} className="relative">
      <button type="button" aria-label={`Notifications (${items.length})`} aria-expanded={open} onClick={() => setOpen((o) => !o)} className="relative grid size-10 place-items-center rounded-[8px] border border-line text-white/80 hover:border-white/30 hover:text-white">
        <Bell aria-hidden className="size-[18px]" strokeWidth={1.7} />
        {items.length > 0 && <span className={cn("absolute -right-1 -top-1 grid min-w-[18px] place-items-center rounded-full px-1 font-body text-[10.5px] font-bold text-white", urgent ? "bg-psg-red" : "bg-amber-500")}>{items.length}</span>}
      </button>
      {open && (
        <div className="absolute right-0 top-12 z-40 w-[min(380px,calc(100vw-32px))] overflow-hidden rounded-[12px] border border-white/15 bg-night-900 shadow-2xl">
          <p className="border-b border-line px-4 py-3 font-body text-[12px] font-semibold uppercase tracking-[0.14em] text-white/70">Notifications</p>
          <ul className="max-h-[60vh] overflow-y-auto">
            {items.length === 0 && <li className="px-4 py-8 text-center font-body text-[13.5px] text-mist">Rien à signaler.</li>}
            {items.map((a, i) => (
              <li key={i}>
                <Link href={a.href} onClick={() => setOpen(false)} className="flex items-start gap-3 px-4 py-3 hover:bg-white/[0.05]">
                  <span aria-hidden className={cn("mt-1.5 size-2 shrink-0 rounded-full", dot[a.level])} />
                  <span className="min-w-0">
                    <span className="block font-body text-[13.5px] text-white">{a.text}</span>
                    <span className="font-body text-[11px] uppercase tracking-[0.12em] text-mist">{label[a.level]}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
