import type { NavItem } from "@/types";

export const mainNav: NavItem[] = [
  { label: "Accueil", href: "/" },
  { label: "Le groupe", href: "/groupe" },
  { label: "Événements", href: "/evenements" },
  { label: "Billetterie", href: "/billetterie" },
  { label: "Communauté", href: "/communaute" },
  { label: "Boutique", href: "/boutique" },
];

export const signature = ["Passion", "Partage", "Féminité", "PSG"];

export const socialLinks = [
  { id: "instagram", label: "Instagram", href: "https://www.instagram.com/" },
  { id: "tiktok", label: "TikTok", href: "https://www.tiktok.com/" },
  { id: "x", label: "X", href: "https://x.com/" },
  { id: "facebook", label: "Facebook", href: "https://www.facebook.com/" },
  { id: "youtube", label: "YouTube", href: "https://www.youtube.com/" },
] as const;
