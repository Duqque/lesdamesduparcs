import { Reveal } from "@/components/ui/Reveal";

interface Props {
  id: string;
  number: string;
  title: string;
  sub?: string;
}

/** En-tête de chapitre : numéro, titre et sous-titre du dossier. */
export function ChapterHead({ id, number, title, sub }: Props) {
  return (
    <Reveal className="mb-14 md:mb-20">
      <p className="t-eyebrow">
        {number} · Chapitre
      </p>
      <h2 id={id} className="mt-4 max-w-[22ch] t-h1">
        {title}
      </h2>
      {sub && <p className="mt-6 max-w-xl text-mist t-lead">{sub}</p>}
    </Reveal>
  );
}
