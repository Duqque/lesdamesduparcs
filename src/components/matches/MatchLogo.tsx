import Image from "next/image";
import { initials } from "@/lib/matches";
import { cn } from "@/lib/cn";

/**
 * Logo dans un cadre CARRÉ : quelle que soit la forme de l'image envoyée, elle est ajustée dans le carré sans déformation
 * (object-contain). Sans logo : pastille avec les initiales du club ou de la compétition.
 */
export function MatchLogo({ src, name, className }: { src?: string | null; name: string; className?: string }) {
  return (
    <span className={cn("relative block aspect-square shrink-0", className)}>
      {src ? (
        <Image src={src} alt={name} fill sizes="80px" unoptimized={src.startsWith("/medias/") || src.startsWith("http")} className="object-contain" />
      ) : (
        <span aria-label={name} role="img" className="grid size-full place-items-center rounded-[14px] border border-white/20 bg-white/[0.06] font-display text-[clamp(11px,28%,20px)] uppercase text-white/85">
          {initials(name)}
        </span>
      )}
    </span>
  );
}
