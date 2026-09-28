/** Pages du site public, telles qu'elles apparaissent dans le back-office. */
export const SITE_PAGES = [
  { path: "*", label: "Tout le site", note: "Maintenance ou « bientôt disponible » sur tout le site (l'administration reste accessible)" },
  { path: "/", label: "Accueil", note: "Contenu modifiable dans « Accueil », rubriques dans « Sections »" },
  { path: "/groupe", label: "Le groupe", note: "Six parties, contenu dans le code du site" },
  { path: "/rejoindre-le-groupe", label: "Rejoindre le groupe (carte membre)", note: "Expérience carte membre" },
  { path: "/rejoindre-le-groupe/adhesion", label: "Adhésion", note: "Principe, tarif, avantages, questions fréquentes" },
  { path: "/evenements", label: "Événements", note: "Géré dans « Événements »" },
  { path: "/actualites", label: "Actualités", note: "Géré dans « Contenu »" },
  { path: "/boutique", label: "Boutique", note: "Catalogue dans le code du site" },
  { path: "/communaute", label: "Communauté", note: "Page en préparation" },
  { path: "/billetterie", label: "Billetterie", note: "Page en préparation" },
  { path: "/contact", label: "Contact", note: "Formulaire de contact" },
  { path: "/connexion", label: "Connexion", note: "Espace membre" },
] as const;

export const NAV_ITEMS = [
  { href: "/groupe", label: "Le groupe" },
  { href: "/actualites", label: "Actualités" },
  { href: "/evenements", label: "Événements" },
  { href: "/boutique", label: "Boutique" },
] as const;
