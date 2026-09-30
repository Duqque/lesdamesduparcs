"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { ImagePlus, Loader2, Trash2 } from "lucide-react";

const W = 300;
const H = 400;

/** Recadre l'image choisie en portrait 300×400 (cadrage centré, type « cover »), entièrement côté navigateur. */
async function cropToPhoto(file: File): Promise<File> {
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Recadrage impossible.");
  const scale = Math.max(W / bitmap.width, H / bitmap.height);
  const sw = W / scale;
  const sh = H / scale;
  const sx = (bitmap.width - sw) / 2;
  const sy = (bitmap.height - sh) / 2;
  ctx.drawImage(bitmap, sx, sy, sw, sh, 0, 0, W, H);
  const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Recadrage impossible."))), "image/jpeg", 0.92));
  return new File([blob], "photo.jpg", { type: "image/jpeg" });
}

/**
 * Choix d'une photo de profil facultative : recadrée automatiquement en portrait 300×400 avant l'envoi (le serveur,
 * voir src/lib/server/photo.ts, vérifie ces dimensions exactes — le recadrage se fait donc toujours ici, côté navigateur).
 * `name` : utilisable directement comme champ d'un formulaire (action serveur) — le fichier recadré est placé dans un
 * input caché de ce nom via DataTransfer, sans passer par `onPick` (facultatif dans ce cas).
 */
export function PhotoCropField({ name, previewUrl, busy, onPick, onRemove }: { name?: string; previewUrl?: string; busy?: boolean; onPick?: (file: File) => void; onRemove?: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const hiddenRef = useRef<HTMLInputElement>(null);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Choisissez une image.");
      return;
    }
    setError(null);
    try {
      const cropped = await cropToPhoto(file);
      if (name && hiddenRef.current) {
        const dt = new DataTransfer();
        dt.items.add(cropped);
        hiddenRef.current.files = dt.files;
      }
      setLocalPreview(URL.createObjectURL(cropped));
      onPick?.(cropped);
    } catch {
      setError("Impossible de traiter cette image.");
    }
  }

  const shown = localPreview ?? previewUrl;
  return (
    <div className="flex items-center gap-5">
      <div className="h-[106px] w-20 shrink-0 overflow-hidden rounded-[10px] border border-white/[0.14] bg-[#121417]">
        {shown ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={shown} alt="" className="size-full object-cover" />
        ) : (
          <div className="flex size-full items-center justify-center text-mist">
            <ImagePlus aria-hidden className="size-6" strokeWidth={1.5} />
          </div>
        )}
      </div>
      <div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
            className="inline-flex h-10 items-center gap-2 rounded-[8px] border border-white/[0.14] bg-[#121417]/90 px-4 font-body text-[13.5px] font-medium text-white transition-colors hover:border-white/30 disabled:opacity-50"
          >
            {busy && <Loader2 aria-hidden className="size-4 animate-spin" />} {shown ? "Changer la photo" : "Ajouter une photo"}
          </button>
          {shown && onRemove && (
            <button
              type="button"
              disabled={busy}
              onClick={onRemove}
              className="inline-flex h-10 items-center gap-2 rounded-[8px] border border-white/[0.14] px-4 font-body text-[13.5px] text-mist transition-colors hover:border-red-400/40 hover:text-red-300 disabled:opacity-50"
            >
              <Trash2 aria-hidden className="size-4" strokeWidth={1.7} /> Retirer
            </button>
          )}
        </div>
        <p className="mt-2 font-body text-[12.5px] leading-[1.6] text-mist">Facultatif. Recadrée automatiquement en portrait (300×400).</p>
        {error && <p role="alert" className="mt-2 font-body text-[12.5px] text-red-300">{error}</p>}
      </div>
      <input ref={inputRef} type="file" accept="image/*" onChange={handleChange} className="hidden" />
      {name && <input ref={hiddenRef} type="file" name={name} className="hidden" />}
    </div>
  );
}
