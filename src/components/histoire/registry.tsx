import type { ReactNode } from "react";
import { AdhesionBody } from "./bodies";

/** Contenu de chaque sous-page (la photo d'en-tête vient de ChapterPhoto, modifiable en administration). */
export const chapterContent: Record<string, { body: ReactNode }> = {
  adhesion: { body: <AdhesionBody /> },
};
