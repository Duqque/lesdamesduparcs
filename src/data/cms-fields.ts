import { manifesto } from "@/data/manifesto";
import { groupe } from "@/data/groupe";

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
  { path: "/qui-sommes-nous", label: "Qui sommes-nous" },
  { path: "/evenements", label: "Événements" },
  { path: "/actualites", label: "Actualités" },
  { path: "/contact", label: "Contact" },
];

export const CMS_FIELDS: CmsField[] = [
  { key: "accueil.manifeste", page: "/", label: "Manifeste (grand texte écrit au défilement)", type: "textarea", default: manifesto.text },
  { key: "groupe.titre", page: "/qui-sommes-nous", label: "Titre (une ligne par retour à la ligne)", type: "textarea", default: "Les Dames\ndu Parc" },
  { key: "groupe.intro", page: "/qui-sommes-nous", label: "Phrase d'introduction", type: "textarea", default: "Les Dames du Parc sont la première communauté 100 % féminine de supportrices du Paris Saint-Germain : des femmes réunies par une même passion pour le club de la capitale, au Parc des Princes et bien au-delà." },
  { key: "groupe.bouton", page: "/qui-sommes-nous", label: "Bouton principal", type: "text", default: "Découvrir notre histoire" },
  { key: "groupe.bento.titre", page: "/qui-sommes-nous", label: "« En bref » : titre", type: "text", default: groupe.bento.title },
  { key: "groupe.bento.texte", page: "/qui-sommes-nous", label: "« En bref » : texte", type: "textarea", default: groupe.bento.lead },
  { key: "groupe.origine.titre", page: "/qui-sommes-nous", label: "« Notre histoire » : titre", type: "text", default: groupe.origin.title },
  { key: "groupe.origine.texte", page: "/qui-sommes-nous", label: "« Notre histoire » : texte (un paragraphe par ligne vide)", type: "textarea", default: groupe.origin.paragraphs.join("\n\n") },
  { key: "groupe.pourquoi.titre", page: "/qui-sommes-nous", label: "« Notre positionnement » : titre", type: "text", default: groupe.why.title },
  { key: "groupe.pourquoi.accroche", page: "/qui-sommes-nous", label: "« Notre positionnement » : phrase d'accroche", type: "text", default: groupe.why.pull },
  { key: "groupe.pourquoi.texte", page: "/qui-sommes-nous", label: "« Notre positionnement » : texte (un paragraphe par ligne vide)", type: "textarea", default: groupe.why.paragraphs.join("\n\n") },
  { key: "groupe.valeurs.titre", page: "/qui-sommes-nous", label: "« Nos valeurs » : titre", type: "text", default: groupe.values.title },
  { key: "groupe.construire.titre", page: "/qui-sommes-nous", label: "« Ce que nous voulons construire » : titre", type: "text", default: groupe.build.title },
  { key: "evenements.titre", page: "/evenements", label: "Titre de la page", type: "text", default: "Événements" },
  { key: "evenements.intro", page: "/evenements", label: "Introduction", type: "textarea", default: "Matchs au Parc, soirées, ateliers et déplacements : les rendez-vous des Dames du Parc se succèdent tout au long de la saison." },
  { key: "evenements.prochains", page: "/evenements", label: "Titre « Prochains événements »", type: "text", default: "Prochains événements" },
  { key: "actualites.titre", page: "/actualites", label: "Titre de la page", type: "text", default: "Actualités" },
  { key: "actualites.intro", page: "/actualites", label: "Introduction", type: "textarea", default: "Matchs, déplacements, portraits et coulisses : la vie des Dames du Parc, aux couleurs de Paris." },
  { key: "actualites.prolonger", page: "/actualites", label: "Titre « Prolongez l'expérience »", type: "text", default: "Prolongez l’expérience" },
  { key: "contact.titre", page: "/contact", label: "Titre de la page", type: "text", default: "Nous contacter" },
  { key: "contact.intro", page: "/contact", label: "Introduction", type: "textarea", default: "Une question, une proposition, une envie de rejoindre le groupe ? Écrivez-nous : votre message arrive directement dans la boîte de l’association." },
];
