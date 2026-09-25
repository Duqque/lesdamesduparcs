/** Rubriques de la page d'accueil, dans leur ordre par défaut. L'ordre et la visibilité se règlent dans le back-office (super administratrice). */
export const HOME_SECTIONS = [
  { key: "manifeste", label: "Manifeste" },
  { key: "rendezvous", label: "Prochains rendez-vous" },
  { key: "citation", label: "Citation et chants" },
  { key: "chant", label: "Le chant du groupe" },
  { key: "actus", label: "Actualités" },
  { key: "galerie", label: "Galerie" },
] as const;

export type HomeSectionKey = (typeof HOME_SECTIONS)[number]["key"];

export function orderHomeSections(order: string[], hidden: string[]) {
  const known = HOME_SECTIONS.map((s) => s.key as string);
  const ordered = [...order.filter((k) => known.includes(k)), ...known.filter((k) => !order.includes(k))];
  return ordered.filter((k) => !hidden.includes(k)) as HomeSectionKey[];
}
