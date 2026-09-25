import type { Permission } from "@/lib/admin/permissions";

export interface NavLeaf {
  label: string;
  href: string;
  perm?: Permission;
}
export interface NavGroup {
  label: string;
  icon: "home" | "users" | "calendar" | "wallet" | "globe" | "newspaper" | "gift" | "megaphone" | "chart" | "settings";
  href?: string;
  perm?: Permission;
  children?: NavLeaf[];
}

/** Navigation du back-office : chaque entrée n'apparaît que si l'administratrice a la permission correspondante. */
export const ADMIN_NAV: NavGroup[] = [
  { label: "Tableau de bord", icon: "home", href: "/admin", perm: "dashboard.view" },
  {
    label: "Adhérentes", icon: "users", perm: "members.view", children: [
      { label: "Toutes les adhérentes", href: "/admin/adherentes" },
      { label: "Nouvelles adhésions", href: "/admin/adherentes?vue=nouvelles" },
      { label: "Renouvellements", href: "/admin/adherentes?vue=renouvellements" },
      { label: "Adhésions expirées", href: "/admin/adherentes?vue=expirees" },
      { label: "Formules d'adhésion", href: "/admin/adherentes/formules", perm: "plans.manage" },
      { label: "Import / Export", href: "/admin/adherentes/import-export", perm: "members.export" },
    ],
  },
  {
    label: "Événements", icon: "calendar", perm: "events.view", children: [
      { label: "Tous les événements", href: "/admin/evenements" },
      { label: "Calendrier", href: "/admin/evenements/calendrier" },
      { label: "Créer un événement", href: "/admin/evenements/nouveau", perm: "events.edit" },
      { label: "Inscriptions", href: "/admin/evenements/inscriptions", perm: "events.attendance" },
      { label: "Listes d'attente", href: "/admin/evenements/liste-attente", perm: "events.attendance" },
      { label: "Présences", href: "/admin/evenements/presences", perm: "events.attendance" },
    ],
  },
  {
    label: "Finances", icon: "wallet", perm: "finance.view", children: [
      { label: "Recettes", href: "/admin/finances" },
      { label: "Transactions", href: "/admin/finances/transactions" },
      { label: "Paiements en attente", href: "/admin/finances/transactions?statut=pending" },
      { label: "Paiements échoués", href: "/admin/finances/transactions?statut=failed" },
      { label: "Remboursements", href: "/admin/finances/transactions?statut=refunded" },
      { label: "Exports", href: "/admin/finances/exports", perm: "finance.export" },
    ],
  },
  {
    label: "Site internet", icon: "globe", perm: "site.content", children: [
      { label: "Accueil", href: "/admin/site/accueil" },
      { label: "Pages", href: "/admin/site/pages", perm: "site.structure" },
      { label: "Sections", href: "/admin/site/sections", perm: "site.structure" },
      { label: "Navigation", href: "/admin/site/navigation", perm: "site.structure" },
      { label: "Médiathèque", href: "/admin/site/mediatheque", perm: "media.manage" },
      { label: "Paramètres SEO", href: "/admin/site/seo", perm: "site.structure" },
      { label: "Design", href: "/admin/site/design", perm: "site.structure" },
    ],
  },
  {
    label: "Contenu", icon: "newspaper", perm: "content.edit", children: [
      { label: "Articles", href: "/admin/contenu" },
      { label: "Catégories", href: "/admin/contenu/categories" },
      { label: "Tags", href: "/admin/contenu/tags" },
      { label: "Brouillons", href: "/admin/contenu?statut=draft" },
      { label: "Publications programmées", href: "/admin/contenu?statut=scheduled" },
    ],
  },
  {
    label: "Communauté", icon: "gift", perm: "community.edit", children: [
      { label: "Avantages", href: "/admin/communaute/avantages" },
      { label: "Partenaires", href: "/admin/communaute/partenaires" },
      { label: "Offres", href: "/admin/communaute/offres" },
      { label: "Codes promotionnels", href: "/admin/communaute/codes-promo" },
    ],
  },
  {
    label: "Communication", icon: "megaphone", perm: "communication.send", children: [
      { label: "Campagnes", href: "/admin/communication" },
      { label: "Modèles", href: "/admin/communication/modeles" },
      { label: "Automatisations", href: "/admin/communication/automatisations" },
      { label: "Notifications", href: "/admin/communication/notifications" },
    ],
  },
  {
    label: "Analytics", icon: "chart", perm: "analytics.view", children: [
      { label: "Membres", href: "/admin/analytics" },
      { label: "Finances", href: "/admin/analytics/finances", perm: "finance.view" },
      { label: "Événements", href: "/admin/analytics/evenements" },
      { label: "Site", href: "/admin/analytics/site" },
      { label: "Rapports", href: "/admin/analytics/rapports", perm: "reports.generate" },
    ],
  },
  {
    label: "Configuration", icon: "settings", children: [
      { label: "Administratrices", href: "/admin/configuration/administratrices", perm: "admins.manage" },
      { label: "Rôles et permissions", href: "/admin/configuration/roles", perm: "admins.manage" },
      { label: "Adhésions", href: "/admin/configuration/adhesions", perm: "settings.edit" },
      { label: "Paiements", href: "/admin/configuration/paiements", perm: "settings.edit" },
      { label: "E-mails", href: "/admin/configuration/emails", perm: "settings.edit" },
      { label: "Données de l'association", href: "/admin/configuration/association", perm: "settings.edit" },
      { label: "Journal d'activité", href: "/admin/configuration/journal", perm: "audit.view" },
      { label: "Mon compte et sécurité", href: "/admin/compte" },
    ],
  },
];
