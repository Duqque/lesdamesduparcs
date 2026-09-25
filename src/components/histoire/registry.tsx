import type { ReactNode } from "react";
import { BuildArt, CircleArt } from "./art/ArtB";
import { LetterArt, StandsArt, StoryArt, WhoArt } from "./art/ArtA";
import { AdhesionBody } from "./bodies";
import { BuildBody, LetterBody, StoryBody, ValuesBody, WhoBody, WhyBody } from "./simple";
import { ValuesArt } from "./art/ValuesArt";

/** Illustration animée et contenu de chaque sous-page. */
export const chapterContent: Record<string, { art: ReactNode; body: ReactNode }> = {
  "lettre-d-introduction": { art: <LetterArt />, body: <LetterBody /> },
  "notre-histoire": { art: <StoryArt />, body: <StoryBody /> },
  "qui-sommes-nous": { art: <WhoArt />, body: <WhoBody /> },
  "nos-valeurs": { art: <ValuesArt />, body: <ValuesBody /> },
  "pourquoi-un-fan-club-feminin": { art: <StandsArt />, body: <WhyBody /> },
  "ce-que-nous-voulons-construire": { art: <BuildArt />, body: <BuildBody /> },
  adhesion: { art: <CircleArt />, body: <AdhesionBody /> },
};
