"use client";

import { useEffect, useRef, useState } from "react";
import { ImagePlus, Trash2, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/cn";

interface Item {
  key: string;
  url: string;
  kind: "image" | "video";
  file?: File;
  width?: number;
  height?: number;
  size?: number;
}

/**
 * Envoi de photos et de vidéos avec aperçu immédiat : chaque fichier choisi s'affiche tout de suite, avec sa résolution et un bouton
 * « Supprimer » rapide. Les médias déjà enregistrés (existing) sont conservés tant qu'ils ne sont pas supprimés : leurs adresses sont
 * envoyées dans des champs cachés portant le nom `existingName`. Rappel des formats acceptés et de la résolution minimale.
 */
export function MediaPicker({
  name,
  existingName,
  existing = [],
  multiple = false,
  video = false,
  only,
  minWidth,
  minHeight,
  label = "Ajouter des photos",
  disabled = false,
}: {
  name: string;
  existingName?: string;
  existing?: string[];
  multiple?: boolean;
  video?: boolean;
  /** Limite le champ aux seules photos ou aux seules vidéos */
  only?: "image" | "video";
  minWidth?: number;
  minHeight?: number;
  label?: string;
  disabled?: boolean;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [kept, setKept] = useState<string[]>(existing);
  const [items, setItems] = useState<Item[]>([]);
  const [dims, setDims] = useState<Record<string, { w: number; h: number }>>({});

  useEffect(() => () => items.forEach((i) => i.url.startsWith("blob:") && URL.revokeObjectURL(i.url)), []); // eslint-disable-line react-hooks/exhaustive-deps

  const accept = only === "video" ? "video/mp4,video/webm" : video ? "image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm" : "image/jpeg,image/png,image/webp,image/gif";
  const sync = (list: Item[]) => {
    // Le champ fichier reflète exactement les éléments non supprimés.
    const dt = new DataTransfer();
    list.forEach((i) => i.file && dt.items.add(i.file));
    if (input.current) input.current.files = dt.files;
  };

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = [...(e.target.files ?? [])];
    const next: Item[] = (multiple ? [...items] : []).concat(picked.map((f) => ({ key: `${f.name}-${f.size}-${f.lastModified}`, url: URL.createObjectURL(f), kind: f.type.startsWith("video/") ? ("video" as const) : ("image" as const), file: f, size: f.size })));
    const seen = new Set<string>();
    const uniq = next.filter((i) => (seen.has(i.key) ? false : (seen.add(i.key), true)));
    setItems(uniq);
    sync(uniq);
  }

  const removeItem = (key: string) => {
    const next = items.filter((i) => i.key !== key);
    setItems(next);
    sync(next);
  };

  const measure = (key: string, w: number, h: number) => setDims((d) => (d[key]?.w === w ? d : { ...d, [key]: { w, h } }));
  const low = (key: string) => {
    const d = dims[key];
    return Boolean(d && minWidth && minHeight && (d.w < minWidth || d.h < minHeight));
  };

  return (
    <div className="grid gap-3">
      {existingName && kept.map((u) => <input key={u} type="hidden" name={existingName} value={u} />)}

      <ul className="flex flex-wrap gap-3">
        {kept.map((u) => (
          <li key={u} className="relative w-[120px]">
            <div className="overflow-hidden rounded-[10px] border border-white/15 bg-black/30">
              {/\.(mp4|webm)$/i.test(u) ? <video src={u} muted className="aspect-[3/4] w-full object-cover" /> : // eslint-disable-next-line @next/next/no-img-element
              <img src={u} alt="" className="aspect-[3/4] w-full object-cover" onLoad={(e) => measure(u, e.currentTarget.naturalWidth, e.currentTarget.naturalHeight)} />}
            </div>
            <p className="mt-1 font-body text-[11.5px] tabular-nums text-mist">{dims[u] ? `${dims[u].w} × ${dims[u].h} px` : "Enregistrée"}</p>
            {low(u) && <p className="flex items-center gap-1 font-body text-[11.5px] text-amber-300"><TriangleAlert aria-hidden className="size-3.5" /> Résolution faible</p>}
            {!disabled && (
              <button type="button" onClick={() => setKept((k) => k.filter((x) => x !== u))} aria-label="Supprimer ce média" className="absolute -right-2 -top-2 grid size-8 place-items-center rounded-full border border-white/25 bg-[#0b1327] text-[#ff9aa8] shadow-lg hover:border-psg-red-bright">
                <Trash2 aria-hidden className="size-4" strokeWidth={1.8} />
              </button>
            )}
          </li>
        ))}
        {items.map((i) => (
          <li key={i.key} className="relative w-[120px]">
            <div className={cn("overflow-hidden rounded-[10px] border bg-black/30", low(i.key) ? "border-amber-400/60" : "border-emerald-400/40")}>
              {i.kind === "video" ? (
                <video src={i.url} muted className="aspect-[3/4] w-full object-cover" onLoadedMetadata={(e) => measure(i.key, e.currentTarget.videoWidth, e.currentTarget.videoHeight)} />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={i.url} alt="" className="aspect-[3/4] w-full object-cover" onLoad={(e) => measure(i.key, e.currentTarget.naturalWidth, e.currentTarget.naturalHeight)} />
              )}
            </div>
            <p className="mt-1 font-body text-[11.5px] tabular-nums text-mist">{dims[i.key] ? `${dims[i.key].w} × ${dims[i.key].h} px` : "…"} · {i.size ? `${(i.size / 1048576).toFixed(1)} Mo` : ""}</p>
            {low(i.key) && <p className="flex items-center gap-1 font-body text-[11.5px] text-amber-300"><TriangleAlert aria-hidden className="size-3.5" /> Résolution faible : risque de flou</p>}
            <button type="button" onClick={() => removeItem(i.key)} aria-label="Supprimer ce fichier" className="absolute -right-2 -top-2 grid size-8 place-items-center rounded-full border border-white/25 bg-[#0b1327] text-[#ff9aa8] shadow-lg hover:border-psg-red-bright">
              <Trash2 aria-hidden className="size-4" strokeWidth={1.8} />
            </button>
          </li>
        ))}
      </ul>

      <label className={cn("inline-flex min-h-11 w-fit cursor-pointer items-center gap-2 rounded-[10px] border border-white/20 px-4 font-body text-[13.5px] font-medium text-white hover:border-white/45", disabled && "pointer-events-none opacity-50")}>
        <ImagePlus aria-hidden className="size-4" /> {label}
        <input ref={input} type="file" name={name} accept={accept} multiple={multiple} disabled={disabled} onChange={onPick} className="sr-only" />
      </label>

      <p className="font-body text-[12px] leading-[1.6] text-mist">
        {only === "video" ? (
          <>Formats acceptés : <strong className="text-white/85">MP4 (H.264), WebM</strong>. 12 Mo maximum par fichier. Résolution minimale : <strong className="text-white/85">{minWidth ?? 1280} × {minHeight ?? 720} px (720p)</strong> ; en dessous, la vidéo apparaîtra floue.</>
        ) : (
          <>Formats acceptés : <strong className="text-white/85">JPEG (.jpg), PNG, WebP, GIF</strong>{video ? <> pour les photos ; <strong className="text-white/85">MP4, WebM</strong> pour les vidéos</> : null}. 12 Mo maximum par fichier.
          {minWidth && minHeight ? <> Résolution minimale des photos : <strong className="text-white/85">{minWidth} × {minHeight} px</strong>{video ? <> (vidéos : 1280 × 720 px, 720p)</> : null} ; en dessous, l&rsquo;image apparaîtra floue ou étirée.</> : null}</>
        )}
      </p>
    </div>
  );
}
