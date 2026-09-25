export const membership = {
  price: 12,
  unit: "saison",
  season: "2026 / 2027",
  joinHref: "/communaute",
  loginHref: "/profil",
} as const;

/** Exemples illustratifs, à remplacer par les vraies offres partenaires. */
export const benefits = [
  { id: "discounts", kicker: "Réductions", big: "−10 %", sub: "chez nos partenaires" },
  { id: "offers", kicker: "Offres membres", big: "Exclusives", sub: "toute la saison" },
  { id: "partners", kicker: "Avantages partenaires", big: "Privilèges", sub: "bars, boutiques, sorties" },
  { id: "experiences", kicker: "Expériences", big: "Accès privé", sub: "soirées & coulisses" },
] as const;

export const agenda = [
  { id: "a1", date: "2026-10-17", tag: "Matchday", title: "PSG × Olympique de Marseille" },
  { id: "a2", date: "2026-10-24", tag: "Événement", title: "Soirée des Dames" },
  { id: "a3", date: "2026-11-08", tag: "Matchday", title: "Match à domicile · adversaire à confirmer" },
  { id: "a4", date: "2026-11-22", tag: "Membres", title: "Rencontre des Dames du Parc" },
] as const;

export const newsletters = [
  "Édition 12 · Retour sur la soirée des Dames",
  "Édition 11 · Interview : une membre, une histoire",
  "Édition 10 · Cap sur Marseille",
] as const;
