import type { NavItem } from "@/types";
import { chapters } from "@/data/chapters";

/** À gauche du logo */
export const leftNav: NavItem[] = [
  { label: "Le groupe", href: "/groupe", children: chapters.map((c) => ({ label: c.title, href: `/groupe/${c.slug}` })) },
  { label: "Actualités", href: "/actualites" },
];

/** À droite du logo */
export const rightNav: NavItem[] = [
  { label: "Événements", href: "/evenements" },
  { label: "Boutique", href: "/boutique" },
  { label: "Contact", href: "/contact" },
];

export const joinLink: NavItem = { label: "Rejoindre le groupe", href: "/rejoindre-le-groupe" };

export const mainNav: NavItem[] = [...leftNav, ...rightNav];

export const signature = ["Passion", "Partage", "Féminité", "PSG"];

export const socialLinks = [
  { id: "instagram", label: "Instagram", href: "https://www.instagram.com/lesdamesduparc/" },
  { id: "tiktok", label: "TikTok", href: "https://www.tiktok.com/@lesdamesduparc" },
  { id: "facebook", label: "Facebook", href: "https://www.facebook.com/p/Dames-Du-Parc-61592989376127/" },
] as const;
