export interface Match {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeLogo: string;
  awayLogo: string;
  /** ISO date (YYYY-MM-DD) */
  date: string;
  /** HH:mm, heure de Paris */
  time: string;
  stadium: string;
  competition: string;
  image: string;
  ticketHref: string;
}

export type EventTag = "Programme" | "Matchday" | "Soirée" | "Atelier" | "Membres" | "Déplacement";

export interface EventSpeaker {
  name: string;
  role: string;
  bio: string;
  initials: string;
}

export interface EventProgramItem {
  time: string;
  title: string;
  text: string;
}

export interface EventRegistrationConfig {
  /** « form » : inscription sur le site (membres) · « external » : via la billetterie · « closed » : terminé */
  mode: "form" | "external" | "closed";
  /** Prix par place, en centimes (0 = gratuit) */
  priceCents: number;
  capacity: number;
  /** Événement pour mineures : date de naissance, responsable légal et autorisation requis */
  guardianRequired?: boolean;
  minAge?: number;
  maxAge?: number;
  /** Une seule place par inscription (ex. une participante) */
  singlePlace?: boolean;
  /** Back-office */
  minCapacity?: number;
  waitlist?: boolean;
  membersOnly?: boolean;
  tiers?: Array<{ label: string; priceCents: number }>;
  paymentMode?: "online" | "onsite" | "manual" | "optional" | "none";
  /** Consignes de règlement affichées aux inscrites (virement, chèque…) */
  paymentInstructions?: string;
}

export type EventStatus = "draft" | "scheduled" | "published" | "archived";

export interface ClubEvent {
  /** Identifiant et slug de l'URL : /evenements/[id] */
  id: string;
  title: string;
  subtitle: string;
  tag: EventTag;
  /** ISO date (YYYY-MM-DD) */
  date: string;
  time: string;
  endTime: string;
  venue: string;
  address: string;
  image: string;
  imageAlt: string;
  /** Style de carte dans le calendrier */
  variant: "photo" | "text";
  /** Mention courte affichée sur la carte (ex. « Sur inscription ») */
  access: string;
  summary: string;
  registration: EventRegistrationConfig;
  description: string[];
  program: EventProgramItem[];
  speakers: EventSpeaker[];
  practical: Array<{ label: string; value: string }>;
  href: string;
  /** Back-office : publication et localisation */
  status?: EventStatus;
  publishAt?: string;
  city?: string;
  gps?: string;
  mapUrl?: string;
  gallery?: string[];
}

export interface NewsItem {
  id: string;
  title: string;
  category: string;
  /** ISO date (YYYY-MM-DD) */
  date: string;
  image: string;
  imageAlt: string;
  excerpt: string;
  content: string[];
  href: string;
}

export interface Product {
  id: string;
  name: string;
  image: string;
  href: string;
}

export interface Chant {
  id: string;
  title: string;
  artist: string;
  audioSrc: string;
  /** Durée de repli (secondes) avant chargement des métadonnées audio */
  duration: number;
  spotifyUrl: string;
  /** Pics normalisés 0-1 pour la waveform */
  waveform: number[];
}

export interface Playlist {
  title: string;
  tagline: string;
  href: string;
}

export interface NavItem {
  label: string;
  href: string;
  /** Sous-pages affichées dans un menu déroulant */
  children?: readonly NavItem[];
}

export interface Community {
  title: string;
  text: string;
  image: string;
  href: string;
}

/* ---- Espace membre (structure prête à être branchée sur un backend) ---- */

export interface MemberProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatarUrl?: string;
}

export interface Membership {
  memberNumber: string;
  /** ISO date */
  joinedAt: string;
  status: "active" | "pending" | "expired";
  tier: string;
  qrCodeValue: string;
}

export interface Ticket {
  id: string;
  matchId: string;
  seat: string;
  qrCodeValue: string;
}

export interface Benefit {
  id: string;
  title: string;
  description: string;
}

export interface MemberNotification {
  id: string;
  message: string;
  read: boolean;
  /** ISO datetime */
  createdAt: string;
}

export interface Purchase {
  id: string;
  label: string;
  amountCents: number;
  /** ISO date */
  date: string;
}

export interface User {
  profile: MemberProfile;
  membership: Membership;
  tickets: Ticket[];
  events: string[];
  benefits: Benefit[];
  favoriteTeam: string;
  notifications: MemberNotification[];
  purchaseHistory: Purchase[];
}
