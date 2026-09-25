"use client";

import { Ticket } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { formatEuros } from "@/lib/registration";
import { formatDay, formatMonthShort } from "@/lib/format";
import type { ClubEvent } from "@/types";

/** Barre fixe « Réserver ma place », toujours visible pendant le défilement. */
export function ReserveBar({ event }: { event: ClubEvent }) {
  const external = event.registration.mode === "external";
  return (
    <div
      role="region"
      aria-label="Réserver ma place"
      className="fixed inset-x-3 bottom-3 z-40 transition-[opacity,transform] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] md:inset-x-auto md:bottom-6 md:left-1/2 md:-translate-x-1/2"
    >
      <div className="flex items-center gap-4 rounded-[14px] border border-white/[0.14] bg-night-950/85 p-2 pl-5 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.9)] backdrop-blur-xl md:gap-8 md:p-2.5 md:pl-7">
        <div className="hidden min-w-0 md:block">
          <p className="max-w-[260px] truncate font-body text-[13.5px] font-medium text-white">{event.title}</p>
          <p className="font-body text-[12px] text-mist">
            {formatDay(event.date)} {formatMonthShort(event.date)} · {external ? "Billetterie" : formatEuros(event.registration.priceCents)}
          </p>
        </div>
        <Button href={external ? event.href : "#inscription"} size="sm" icon={Ticket} arrow={false} className="w-full md:w-auto">
          Réserver ma place
        </Button>
      </div>
    </div>
  );
}
