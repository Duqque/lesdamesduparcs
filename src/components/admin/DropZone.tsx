"use client";

import { useRef, useState } from "react";
import { UploadCloud } from "lucide-react";
import { cn } from "@/lib/cn";

/** Zone de dépôt (glisser-déposer) qui alimente un champ fichier et envoie le formulaire. */
export function DropZone({ name = "files" }: { name?: string }) {
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const submit = () => input.current?.form?.requestSubmit();
  return (
    <label
      onDragOver={(e) => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        if (input.current && e.dataTransfer.files.length) {
          input.current.files = e.dataTransfer.files;
          submit();
        }
      }}
      className={cn("flex cursor-pointer flex-col items-center gap-2 rounded-[12px] border border-dashed px-6 py-8 text-center font-body text-[13.5px] text-mist transition-colors hover:border-white/40 hover:text-white", over ? "border-psg-red-bright bg-psg-red/10 text-white" : "border-white/25")}
    >
      <UploadCloud aria-hidden className="size-6" strokeWidth={1.5} />
      <span>Glissez des fichiers ici ou cliquez pour choisir</span>
      <span className="text-[12px]">Images, vidéos MP4/WebM, PDF · 12 Mo maximum</span>
      <input ref={input} type="file" name={name} multiple accept="image/*,video/mp4,video/webm,application/pdf" className="sr-only" onChange={submit} />
    </label>
  );
}
