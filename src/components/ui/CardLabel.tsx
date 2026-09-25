import type { LucideIcon } from "lucide-react";

export function CardLabel({ icon: Icon, children }: { icon: LucideIcon; children: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="grid size-[18px] place-items-center rounded-full border border-white/70 text-white">
        <Icon aria-hidden className="size-[10px]" strokeWidth={2.4} />
      </span>
      <span className="font-body text-[12px] font-bold uppercase tracking-[0.1em] text-white">{children}</span>
    </div>
  );
}
