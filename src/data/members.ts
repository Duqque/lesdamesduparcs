import type { User } from "@/types";

export const currentMember: User = {
  profile: {
    id: "mbr_001",
    firstName: "Léa",
    lastName: "Martin",
    email: "lea@example.com",
  },
  membership: {
    memberNumber: "DDP-2024-0042",
    joinedAt: "2024-09-01",
    status: "active",
    tier: "Membre",
    qrCodeValue: "DDP-2024-0042",
  },
  tickets: [],
  events: [],
  benefits: [],
  favoriteTeam: "Paris Saint-Germain",
  notifications: [
    { id: "n1", message: "Nouvelle soirée des Dames le 24 octobre.", read: false, createdAt: "2026-09-24T18:00:00Z" },
  ],
  purchaseHistory: [],
};

export const memberMenu = [
  { id: "card", label: "Ma carte membre", href: "/profil#carte-membre" },
  { id: "tickets", label: "Mes billets", href: "/profil#billets" },
  { id: "benefits", label: "Mes avantages", href: "/profil#avantages" },
  { id: "team", label: "Mon équipe", href: "/profil#equipe" },
] as const;
