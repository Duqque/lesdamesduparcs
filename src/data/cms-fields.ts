import { manifesto } from "@/data/manifesto";
import { groupe } from "@/data/groupe";

/** Textes des pages modifiables dans l'administration (Site internet > Contenus des pages). La valeur par défaut est le texte d'origine du site. */
export interface CmsField {
  key: string;
  page: string;
  label: string;
  type: "text" | "textarea";
  default: string;
  /** Section de la page : regroupe les champs dans l'administration. */
  section?: string;
}

type QsnField = Omit<CmsField, "page" | "section">;
/** Champs de « Qui sommes-nous », regroupés par section de la page. */
const qsn = (section: string, fields: QsnField[]): CmsField[] => fields.map((f) => ({ ...f, page: "/qui-sommes-nous", section }));

export const CMS_PAGES: Array<{ path: string; label: string }> = [
  { path: "/", label: "Accueil" },
  { path: "/qui-sommes-nous", label: "Qui sommes-nous" },
  { path: "/evenements", label: "Événements" },
  { path: "/actualites", label: "Actualités" },
  { path: "/contact", label: "Contact" },
];

export const CMS_FIELDS: CmsField[] = [
  { key: "accueil.manifeste", page: "/", label: "Manifeste (grand texte écrit au défilement)", type: "textarea", default: manifesto.text },
  ...qsn("En-tête de page", [
    { key: "groupe.hero.etiquette", label: "Étiquette au-dessus du titre", type: "text", default: "Qui sommes-nous" },
    { key: "groupe.titre", label: "Titre (une ligne par retour à la ligne)", type: "textarea", default: "Les Dames\ndu Parc" },
    { key: "groupe.intro", label: "Phrase d'introduction", type: "textarea", default: groupe.hero.intro },
    { key: "groupe.bouton", label: "Bouton principal (mène à « Notre histoire »)", type: "text", default: groupe.hero.button },
    { key: "groupe.hero.bouton2", label: "Second bouton (mène à l'adhésion, masqué pour les adhérentes)", type: "text", default: "Devenir membre" },
  ]),
  ...qsn("En bref", [
    { key: "groupe.bento.etiquette", label: "Étiquette au-dessus du titre", type: "text", default: groupe.bento.eyebrow },
    { key: "groupe.bento.titre", label: "Titre", type: "text", default: groupe.bento.title },
    { key: "groupe.bento.texte", label: "Texte", type: "textarea", default: groupe.bento.lead },
    ...groupe.bento.stats.flatMap((s, i): QsnField[] => [
      { key: `groupe.bento.chiffre${i + 1}.valeur`, label: `Chiffre ${i + 1} (un nombre seul s'anime en comptant)`, type: "text", default: s.value },
      { key: `groupe.bento.chiffre${i + 1}.legende`, label: `Légende du chiffre ${i + 1}`, type: "text", default: s.label },
    ]),
    { key: "groupe.bento.reseaux", label: "Encadré des réseaux sociaux", type: "text", default: "Nous suivre" },
  ]),
  ...qsn("Notre histoire", [
    { key: "groupe.origine.etiquette", label: "Étiquette au-dessus du titre", type: "text", default: groupe.origin.eyebrow },
    { key: "groupe.origine.titre", label: "Titre", type: "text", default: groupe.origin.title },
    { key: "groupe.origine.texte", label: "Texte (un paragraphe par ligne vide)", type: "textarea", default: groupe.origin.paragraphs.join("\n\n") },
  ]),
  ...qsn("Notre positionnement", [
    { key: "groupe.pourquoi.etiquette", label: "Étiquette au-dessus du titre", type: "text", default: groupe.why.eyebrow },
    { key: "groupe.pourquoi.titre", label: "Titre", type: "text", default: groupe.why.title },
    { key: "groupe.pourquoi.accroche", label: "Phrase d'accroche", type: "text", default: groupe.why.pull },
    { key: "groupe.pourquoi.texte", label: "Texte (un paragraphe par ligne vide)", type: "textarea", default: groupe.why.paragraphs.join("\n\n") },
  ]),
  ...qsn("Nos valeurs", [
    { key: "groupe.valeurs.etiquette", label: "Étiquette au-dessus du titre", type: "text", default: groupe.values.eyebrow },
    { key: "groupe.valeurs.titre", label: "Titre", type: "text", default: groupe.values.title },
    ...groupe.values.items.flatMap((v, i): QsnField[] => [
      { key: `groupe.valeurs.${i + 1}.titre`, label: `Valeur ${i + 1} : nom (l'icône reste celle de « ${v.title} »)`, type: "text", default: v.title },
      { key: `groupe.valeurs.${i + 1}.texte`, label: `Valeur ${i + 1} : phrase`, type: "textarea", default: v.text },
    ]),
  ]),
  ...qsn("Ce que nous voulons construire", [
    { key: "groupe.construire.etiquette", label: "Étiquette au-dessus du titre", type: "text", default: groupe.build.eyebrow },
    { key: "groupe.construire.titre", label: "Titre", type: "text", default: groupe.build.title },
    ...groupe.build.items.flatMap((b, i): QsnField[] => [
      { key: `groupe.construire.${i + 1}.titre`, label: `Ambition ${i + 1} : titre`, type: "text", default: b.title },
      { key: `groupe.construire.${i + 1}.texte`, label: `Ambition ${i + 1} : texte`, type: "textarea", default: b.text },
    ]),
  ]),
  ...qsn("Rejoindre (bas de page)", [
    { key: "groupe.rejoindre.titre", label: "Titre", type: "text", default: "Rejoindre les Dames du Parc" },
    { key: "groupe.rejoindre.bouton1", label: "Premier bouton (mène à l'adhésion, masqué pour les adhérentes)", type: "text", default: "Devenir membre" },
    { key: "groupe.rejoindre.bouton2", label: "Second bouton (mène à « Comment ça marche »)", type: "text", default: "Comment ça marche" },
  ]),
  { key: "evenements.titre", page: "/evenements", label: "Titre de la page", type: "text", default: "Événements" },
  { key: "evenements.intro", page: "/evenements", label: "Introduction", type: "textarea", default: "Matchs au Parc, soirées, ateliers et déplacements : les rendez-vous des Dames du Parc se succèdent tout au long de la saison." },
  { key: "evenements.prochains", page: "/evenements", label: "Titre « Prochains événements »", type: "text", default: "Prochains événements" },
  { key: "actualites.titre", page: "/actualites", label: "Titre de la page", type: "text", default: "Actualités" },
  { key: "actualites.intro", page: "/actualites", label: "Introduction", type: "textarea", default: "Matchs, déplacements, portraits et coulisses : la vie des Dames du Parc, aux couleurs de Paris." },
  { key: "actualites.prolonger", page: "/actualites", label: "Titre « Prolongez l'expérience »", type: "text", default: "Prolongez l’expérience" },
  { key: "contact.titre", page: "/contact", label: "Titre de la page", type: "text", default: "Nous contacter" },
  { key: "contact.intro", page: "/contact", label: "Introduction", type: "textarea", default: "Une question, une proposition, une envie de rejoindre le groupe ? Écrivez-nous : votre message arrive directement dans la boîte de l’association." },
];

const DEFAULTS = new Map(CMS_FIELDS.map((f) => [f.key, f.default]));
/** Texte d'origine d'un champ (celui affiché tant que rien n'a été saisi dans l'administration). */
export const cmsDefault = (key: string) => DEFAULTS.get(key) ?? "";
