"use client";

import { Download } from "lucide-react";
import { btn } from "@/components/admin/ui";

/** Bouton d'export : réunit les colonnes cochées dans le paramètre « cols » avant l'envoi du formulaire. */
export function ExportSubmit() {
  return (
    <button
      type="submit"
      className={btn.primary}
      onClick={(e) => {
        const form = e.currentTarget.form;
        if (!form) return;
        const cols = [...form.querySelectorAll<HTMLInputElement>("input[data-export-col]:checked")].map((i) => i.dataset.exportCol).join(",");
        if (!cols) {
          e.preventDefault();
          return;
        }
        (form.elements.namedItem("cols") as HTMLInputElement).value = cols;
      }}
    >
      <Download aria-hidden className="size-4" /> Télécharger
    </button>
  );
}
