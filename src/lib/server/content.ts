import "server-only";
import { adhesion } from "@/data/adhesion";
import { news as seedNews } from "@/data/news";
import type { NewsItem } from "@/types";
import { collection, singleton, type Row } from "./db";

/* ---------- Articles ---------- */

export type PublishStatus = "draft" | "scheduled" | "published" | "archived";

export interface Article extends Row {
  /** Identifiant = adresse de l'article : /actualites/[id] */
  title: string;
  summary: string;
  /** Paragraphes séparés par une ligne vide */
  content: string;
  image: string;
  imageAlt: string;
  category: string;
  tags: string[];
  authorName: string;
  status: PublishStatus;
  publishAt?: string;
  /** Date affichée (AAAA-MM-JJ) */
  date: string;
  views: number;
  video?: string;
  gallery: string[];
  seoTitle?: string;
  seoDescription?: string;
  origin?: "seed";
}

export const articlesDb = collection<Article>("articles", () =>
  seedNews.map((n) => ({
    id: n.id,
    title: n.title,
    summary: n.excerpt,
    content: n.content.join("\n\n"),
    image: n.image,
    imageAlt: n.imageAlt,
    category: n.category,
    tags: [],
    authorName: "Les Dames du Parc",
    status: "published" as const,
    date: n.date,
    views: 0,
    gallery: [],
    origin: "seed" as const,
  })),
);

const isLive = (a: Article, now = Date.now()) => a.status === "published" || (a.status === "scheduled" && !!a.publishAt && new Date(a.publishAt).getTime() <= now);

export const toNewsItem = (a: Article): NewsItem => ({
  id: a.id,
  title: a.title,
  category: a.category,
  date: a.date,
  image: a.image,
  imageAlt: a.imageAlt,
  excerpt: a.summary,
  content: a.content.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean),
  href: `/actualites/${a.id}`,
});

export async function getPublishedNews(): Promise<NewsItem[]> {
  return (await articlesDb.all()).filter((a) => isLive(a)).sort((a, b) => b.date.localeCompare(a.date)).map(toNewsItem);
}
export async function getNewsItem(id: string) {
  const a = await articlesDb.get(id);
  return a && isLive(a) ? toNewsItem(a) : null;
}

export const slugify = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80) || "article";

/* ---------- Communauté : avantages, partenaires, codes promotionnels ---------- */

export interface Benefit extends Row {
  title: string;
  text: string;
  visible: boolean;
  order: number;
}
export const benefitsDb = collection<Benefit>("benefits", () =>
  adhesion.benefits.map((b, i) => ({ id: `b${i + 1}`, title: b.title, text: b.text, visible: true, order: i + 1 })),
);

export interface Partner extends Row {
  name: string;
  logo?: string;
  description: string;
  website?: string;
  address?: string;
  contact?: string;
  advantage: string;
  promoCode?: string;
  category: string;
  startsAt?: string;
  endsAt?: string;
  visible: boolean;
}
export const partnersDb = collection<Partner>("partners");

export interface PromoCode extends Row {
  code: string;
  label: string;
  type: "percent" | "amount";
  /** Pourcentage, ou montant en centimes */
  value: number;
  scope: "adhesion" | "event" | "shop" | "all";
  startsAt?: string;
  endsAt?: string;
  maxUses?: number;
  /** Panier minimum (centimes) pour que le code s'applique */
  minCents?: number;
  uses: number;
  active: boolean;
}
export const promoCodes = collection<PromoCode>("promo_codes");

export interface Offer extends Row {
  title: string;
  text: string;
  partnerId?: string;
  startsAt?: string;
  endsAt?: string;
  visible: boolean;
  membersOnly: boolean;
}
export const offersDb = collection<Offer>("offers");

/* ---------- Communication ---------- */

export interface Campaign extends Row {
  subject: string;
  body: string;
  buttonLabel?: string;
  buttonUrl?: string;
  audience: string[];
  status: "draft" | "scheduled" | "sent" | "queued";
  scheduledAt?: string;
  sentAt?: string;
  recipients: number;
  note?: string;
}
export const campaigns = collection<Campaign>("campaigns");

export interface EmailTemplate extends Row {
  key: string;
  name: string;
  subject: string;
  body: string;
}
export const DEFAULT_TEMPLATES: Array<Omit<EmailTemplate, "createdAt" | "updatedAt">> = [
  { id: "welcome", key: "welcome", name: "Bienvenue (nouvelle adhésion)", subject: "Bienvenue chez Les Dames du Parc", body: "Bonjour {{prenom}},\n\nBienvenue chez Les Dames du Parc. Ton adhésion {{saison}} est enregistrée : ton numéro de membre est {{numero}}.\n\nTu retrouves ta carte et ton attestation dans ton espace membre." },
  { id: "payment", key: "payment", name: "Confirmation de paiement", subject: "Paiement reçu", body: "Bonjour {{prenom}},\n\nNous avons bien reçu ton paiement de {{montant}} pour {{objet}}. Merci !" },
  { id: "payment_failed", key: "payment_failed", name: "Relance de paiement", subject: "Ton paiement n'a pas abouti", body: "Bonjour {{prenom}},\n\nTon paiement pour {{objet}} n'a pas pu être finalisé. Tu peux le régler depuis ton espace membre." },
  { id: "renewal", key: "renewal", name: "Rappel de renouvellement", subject: "Ton adhésion arrive à échéance", body: "Bonjour {{prenom}},\n\nTon adhésion se termine le {{fin}}. Pense à la renouveler pour rester membre." },
  { id: "event_confirmation", key: "event_confirmation", name: "Confirmation d'inscription à un événement", subject: "Inscription confirmée : {{objet}}", body: "Bonjour {{prenom}},\n\nTon inscription à {{objet}} est confirmée. À très vite !" },
  { id: "event_reminder", key: "event_reminder", name: "Rappel d'événement", subject: "Rappel : {{objet}}", body: "Bonjour {{prenom}},\n\nUn rappel pour {{objet}} : {{date}}. Toutes les informations sont dans ton espace membre." },
  { id: "waitlist", key: "waitlist", name: "Place libérée (liste d'attente)", subject: "Une place s'est libérée : {{objet}}", body: "Bonjour {{prenom}},\n\nUne place vient de se libérer pour {{objet}}. Confirme ta venue rapidement : elle est proposée à la personne suivante en l'absence de réponse." },
  { id: "order_paid", key: "order_paid", name: "Commande boutique payée", subject: "Ta commande {{objet}} est confirmée", body: "Bonjour {{prenom}},\n\nMerci pour ta commande ({{objet}}), d'un montant de {{montant}}. Nous la préparons et t'écrivons dès son expédition." },
  { id: "order_shipped", key: "order_shipped", name: "Commande expédiée", subject: "Ta commande {{objet}} est en route", body: "Bonjour {{prenom}},\n\nTa commande {{objet}} vient de partir. Suivi : {{suivi}}." },
  { id: "order_ready", key: "order_ready", name: "Commande prête au retrait", subject: "Ta commande {{objet}} est prête", body: "Bonjour {{prenom}},\n\nTa commande {{objet}} est prête : tu pourras la retirer lors du prochain événement des Dames du Parc. Nous te préciserons la date et le lieu." },
  { id: "event_payment_due", key: "event_payment_due", name: "Inscription : paiement à régler", subject: "Règlement de ton inscription : {{objet}}", body: "Bonjour {{prenom}},\n\nTon inscription à {{objet}} est enregistrée. Montant à régler : {{montant}}.\n\n{{consignes}}" },
];

export const templates = collection<EmailTemplate>("email_templates", () => DEFAULT_TEMPLATES);

/** Ajoute les modèles introduits depuis la création du fichier (mises à jour du site). */
export async function ensureTemplates() {
  const have = new Set((await templates.all()).map((t) => t.key));
  for (const t of DEFAULT_TEMPLATES) if (!have.has(t.key)) await templates.insert(t as never);
}

export interface EmailLog extends Row {
  to: string;
  subject: string;
  kind: string;
  status: "sent" | "skipped" | "failed";
  detail?: string;
}
export const emailLog = collection<EmailLog>("email_log");

/* ---------- Messages reçus par le formulaire de contact ---------- */

export interface ContactMessage extends Row {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  message: string;
  status: "new" | "read" | "done";
  /** Le message a-t-il bien été transmis à la boîte de l'association ? */
  delivered: boolean;
  handledBy?: string;
}
export const contactMessages = collection<ContactMessage>("contact_messages");

/* ---------- Médiathèque ---------- */

export interface MediaFile extends Row {
  name: string;
  mime: string;
  size: number;
  width?: number;
  height?: number;
  folder: "photos" | "videos" | "logos" | "affiches" | "documents";
  ext: string;
}
export const mediaDb = collection<MediaFile>("media");

/* ---------- Analytics du site (mesure interne, sans cookie ni adresse IP) ---------- */

export interface PageView extends Row {
  path: string;
  sid: string;
  ref: string;
}
export const pageViews = collection<PageView>("page_views");

/* ---------- Configuration du site (structure et design : super administratrice) ---------- */

export const siteConfig = singleton("site_config", {
  home: {
    heroTitle: "",
    heroSubtitle: "",
    heroCta: "",
    /** Photo de l'en-tête de l'accueil (vide = photo d'origine) */
    heroImage: "",
    heroImageAlt: "",
    /** Carte rouge « Adhérer » sous le manifeste (vide = valeurs d'origine) */
    ctaImage: "",
    ctaImageAlt: "",
    ctaTitle: "",
    ctaText: "",
    ctaButton: "",
    hiddenSections: [] as string[],
    sectionOrder: [] as string[],
    featuredEventIds: [] as string[],
    featuredArticleIds: [] as string[],
  },
  seo: {} as Record<string, { title?: string; description?: string }>,
  navigation: { hidden: [] as string[], labels: {} as Record<string, string> },
  design: { accent: "#d90f2c", note: "" },
  /** Photos de la rubrique « Le groupe » modifiées en administration (clé : identifiant du chapitre). */
  groupPhotos: {} as Record<string, { src: string; alt: string }>,
});
