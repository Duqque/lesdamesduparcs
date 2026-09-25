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

export interface ClubEvent {
  id: string;
  title: string;
  /** ISO date (YYYY-MM-DD) */
  date: string;
  time: string;
  venue: string;
  image: string;
  href: string;
}

export interface NewsItem {
  id: string;
  title: string;
  category: string;
  /** ISO date (YYYY-MM-DD) */
  date: string;
  image: string;
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
