import { manifesto } from "@/data/manifesto";

/** Textes des pages modifiables dans l'administration (Site internet > Contenus des pages). La valeur par défaut est le texte d'origine du site. */
export interface CmsField {
  key: string;
  page: string;
  label: string;
  type: "text" | "textarea";
  default: string;
}

export const CMS_PAGES: Array<{ path: string; label: string }> = [
  { path: "/", label: "Accueil" },
  { path: "/groupe", label: "Le groupe" },
  { path: "/evenements", label: "Événements" },
  { path: "/actualites", label: "Actualités" },
  { path: "/contact", label: "Contact" },
];

export const CMS_FIELDS: CmsField[] = [
  { key: "accueil.manifeste", page: "/", label: "Manifeste (grand texte écrit au défilement)", type: "textarea", default: manifesto.text },
  { key: "groupe.titre", page: "/groupe", label: "Titre (une ligne par retour à la ligne)", type: "textarea", default: "Les Dames\ndu Parc" },
  { key: "groupe.intro", page: "/groupe", label: "Phrase d'introduction", type: "textarea", default: "Une communauté de supportrices réunies par la même passion : le Paris Saint-Germain." },
  { key: "groupe.bouton", page: "/groupe", label: "Bouton principal", type: "text", default: "Lire notre histoire" },
  { key: "evenements.titre", page: "/evenements", label: "Titre de la page", type: "text", default: "Événements" },
  { key: "evenements.intro", page: "/evenements", label: "Introduction", type: "textarea", default: "Matchs au Parc, soirées, ateliers et déplacements : les rendez-vous des Dames du Parc se succèdent tout au long de la saison." },
  { key: "evenements.prochains", page: "/evenements", label: "Titre « Prochains événements »", type: "text", default: "Prochains événements" },
  { key: "actualites.titre", page: "/actualites", label: "Titre de la page", type: "text", default: "Actualités" },
  { key: "actualites.intro", page: "/actualites", label: "Introduction", type: "textarea", default: "Matchs, déplacements, portraits et coulisses : la vie des Dames du Parc, aux couleurs de Paris." },
  { key: "actualites.prolonger", page: "/actualites", label: "Titre « Prolongez l'expérience »", type: "text", default: "Prolongez l’expérience" },
  { key: "contact.titre", page: "/contact", label: "Titre de la page", type: "text", default: "Nous contacter" },
  { key: "contact.intro", page: "/contact", label: "Introduction", type: "textarea", default: "Une question, une proposition, une envie de rejoindre le groupe ? Écrivez-nous : votre message arrive directement dans la boîte de l’association." },
];
