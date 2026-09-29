import type { NavItem } from "@/types";

/** À gauche du logo */
export const leftNav: NavItem[] = [
  { label: "Qui sommes-nous", href: "/qui-sommes-nous" },
  { label: "Actualités", href: "/actualites" },
];

/** À droite du logo */
export const rightNav: NavItem[] = [
  { label: "Événements", href: "/evenements" },
  { label: "Boutique", href: "/boutique" },
  { label: "Adhésion", href: "/rejoindre-le-groupe/inscription" },
];

export const joinLink: NavItem = { label: "Rejoindre le groupe", href: "/rejoindre-le-groupe" };

/** Menu mobile et tablette : « Contact » y figure (sur ordinateur, il s'ouvre depuis l'icône courrier). */
export const mainNav: NavItem[] = [...leftNav, ...rightNav, { label: "Contact", href: "/contact" }];

export const signature = ["Passion", "Partage", "Féminité", "PSG"];

export const socialLinks = [
  { id: "instagram", label: "Instagram", href: "https://www.instagram.com/lesdamesduparc/" },
  { id: "tiktok", label: "TikTok", href: "https://www.tiktok.com/@lesdamesduparc" },
] as const;
