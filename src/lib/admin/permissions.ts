/** Rôles et permissions du back-office. Le design et la structure du site ne sont modifiables que par la super administratrice. */

export const PERMISSIONS = [
  "dashboard.view",
  "members.view", // liste et fiche (identité, contact, adhésion)
  "members.pii", // date de naissance, adresse, responsable légal, pièces
  "members.edit",
  "members.delete", // suspension définitive, anonymisation
  "members.export",
  "plans.manage",
  "events.view",
  "events.edit",
  "events.attendance",
  "events.pricing", // tarifs, modes de paiement, prix des événements
  "shop.view",
  "shop.edit", // fiches produits, photos, visibilité
  "shop.pricing", // prix, prix barrés, frais de livraison
  "shop.stock",
  "shop.orders", // suivi des commandes et de leur expédition
  "finance.view",
  "finance.edit", // marquer payé, annuler, rembourser
  "finance.export",
  "content.edit", // articles, catégories
  "media.manage",
  "community.edit", // partenaires, avantages, offres, codes promo
  "communication.send",
  "analytics.view",
  "reports.generate",
  "site.content", // textes, images, éléments mis en avant
  "site.structure", // pages, sections, navigation, design, SEO : super administratrice uniquement
  "admins.manage",
  "settings.edit",
  "audit.view",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

export type Role = "super" | "admin" | "tresoriere" | "communication" | "benevole";

export const ROLE_LABELS: Record<Role, string> = {
  super: "Super administratrice",
  admin: "Administratrice",
  tresoriere: "Trésorière",
  communication: "Communication",
  benevole: "Bénévole événementiel",
};

export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  super: "Accès complet, y compris la structure et le design du site, les administratrices et la configuration.",
  admin: "Adhérentes, événements et leurs tarifs, boutique (produits, prix, stocks, commandes), contenu, communication et statistiques. Ne modifie ni la structure ni le design du site.",
  tresoriere: "Paiements, finances, remboursements, exports financiers, tarifs des événements, prix et commandes de la boutique.",
  communication: "Articles, photos, médiathèque, événements (sans les tarifs), fiches produits (sans les prix), textes du site et campagnes.",
  benevole: "Inscriptions, listes et présences aux événements.",
};

const set = (...p: Permission[]) => new Set<Permission>(p);

export const ROLE_PERMISSIONS: Record<Role, ReadonlySet<Permission>> = {
  super: new Set(PERMISSIONS),
  admin: set(
    "dashboard.view", "members.view", "members.pii", "members.edit", "members.export", "plans.manage",
    "events.view", "events.edit", "events.attendance", "events.pricing", "shop.view", "shop.edit", "shop.pricing", "shop.stock", "shop.orders", "content.edit", "media.manage", "community.edit",
    "communication.send", "analytics.view", "reports.generate", "site.content",
  ),
  tresoriere: set("dashboard.view", "members.view", "events.view", "events.pricing", "shop.view", "shop.pricing", "shop.orders", "finance.view", "finance.edit", "finance.export", "analytics.view", "reports.generate"),
  communication: set("dashboard.view", "events.view", "events.edit", "shop.view", "shop.edit", "content.edit", "media.manage", "community.edit", "communication.send", "site.content", "analytics.view"),
  benevole: set("dashboard.view", "members.view", "events.view", "events.attendance"),
};

export const PERMISSION_LABELS: Record<Permission, string> = {
  "dashboard.view": "Tableau de bord",
  "members.view": "Voir les adhérentes",
  "members.pii": "Données personnelles sensibles",
  "members.edit": "Modifier les adhérentes",
  "members.delete": "Supprimer, anonymiser",
  "members.export": "Exporter les adhérentes",
  "plans.manage": "Formules d'adhésion",
  "events.view": "Voir les événements",
  "events.edit": "Créer et modifier les événements",
  "events.attendance": "Inscriptions et présences",
  "events.pricing": "Tarifs et paiement des événements",
  "shop.view": "Voir la boutique",
  "shop.edit": "Produits et photos",
  "shop.pricing": "Prix et livraison de la boutique",
  "shop.stock": "Stocks",
  "shop.orders": "Commandes",
  "finance.view": "Voir les finances",
  "finance.edit": "Encaisser, annuler, rembourser",
  "finance.export": "Exports financiers",
  "content.edit": "Articles et catégories",
  "media.manage": "Médiathèque",
  "community.edit": "Partenaires, avantages, codes promo",
  "communication.send": "Campagnes et e-mails",
  "analytics.view": "Statistiques",
  "reports.generate": "Rapports",
  "site.content": "Textes et images du site",
  "site.structure": "Structure et design du site",
  "admins.manage": "Administratrices et rôles",
  "settings.edit": "Paramètres de l'association",
  "audit.view": "Journal d'activité",
};

export const can = (role: Role, perm: Permission) => ROLE_PERMISSIONS[role].has(perm);
