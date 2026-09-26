import type { ReactNode } from "react";
import { AdhesionBody } from "./bodies";
import { BuildBody, LetterBody, StoryBody, ValuesBody, WhoBody, WhyBody } from "./simple";

/** Contenu de chaque sous-page (la photo d'en-tête vient de ChapterPhoto, modifiable en administration). */
export const chapterContent: Record<string, { body: ReactNode }> = {
  "lettre-d-introduction": { body: <LetterBody /> },
  "notre-histoire": { body: <StoryBody /> },
  "qui-sommes-nous": { body: <WhoBody /> },
  "nos-valeurs": { body: <ValuesBody /> },
  "pourquoi-un-fan-club-feminin": { body: <WhyBody /> },
  "ce-que-nous-voulons-construire": { body: <BuildBody /> },
  adhesion: { body: <AdhesionBody /> },
};
