import Image from "next/image";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { CardLabel } from "./CardLabel";

interface Props {
  label: string;
  icon: LucideIcon;
  image: string;
  imageClassName?: string;
  overlayClassName?: string;
  sizes: string;
  className?: string;
  children: ReactNode;
  labelAside?: ReactNode;
}

export function PhotoCard({ label, icon, image, imageClassName, overlayClassName, sizes, className, children, labelAside }: Props) {
  return (
    <article
      data-cursor="view"
      className={cn(
        "group relative isolate flex w-full min-h-[360px] flex-col overflow-hidden rounded-[8px] border border-line bg-night-900 p-6 shadow-[0_24px_60px_-34px_rgba(0,0,0,0.95)] xl:min-h-[380px]",
        className,
      )}
    >
      <div aria-hidden className="absolute inset-0 -z-10 overflow-hidden">
        <Image
          src={image}
          alt=""
          fill
          sizes={sizes}
          className={cn("object-cover transition-transform duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.03]", imageClassName)}
        />
        <div
          className={cn(
            "absolute inset-0 bg-[linear-gradient(180deg,rgba(3,9,25,0.35)_0%,rgba(3,9,25,0.18)_28%,rgba(3,9,25,0.78)_66%,rgba(3,9,25,0.94)_100%)] transition-opacity duration-500 group-hover:opacity-[0.88]",
            overlayClassName,
          )}
        />
      </div>
      <div className="flex items-center justify-between gap-3">
        <CardLabel icon={icon}>{label}</CardLabel>
        {labelAside}
      </div>
      <div className="mt-auto flex flex-col pt-24">{children}</div>
    </article>
  );
}
