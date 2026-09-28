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
  /** Masque le nom de l'auteure sur l'article publié */
  hideAuthor?: boolean;
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
  tags: a.tags ?? [],
  authorName: a.hideAuthor ? undefined : a.authorName || undefined,
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
  /** Réduction maximum accordée (centimes), utile pour un pourcentage */
  maxDiscountCents?: number;
  /** Nombre maximum d'utilisations par compte (ou par adresse e-mail pour un achat sans compte) */
  perUserLimit?: number;
  /** Le code ne s'applique qu'aux produits de ces catégories et/ou à ces produits (vide = toute la boutique) */
  categories?: string[];
  productIds?: string[];
  /** Réservé aux adhérentes dont l'adhésion est active */
  membersOnly?: boolean;
  /** Réservé aux nouvelles adhérentes (adhésion créée depuis moins de 30 jours) */
  newMembersOnly?: boolean;
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
  /** Photo d'en-tête, autres photos, liens utiles (boutons) ajoutés au message */
  imageUrl?: string;
  imageAlt?: string;
  extraImages?: string[];
  links?: Array<{ label: string; url: string }>;
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
  { id: "welcome", key: "welcome", name: "Compte créé (avant validation de l'adhésion)", subject: "Ton compte Les Dames du Parc est créé", body: "Bonjour **{{prenom}}**,\n\nTon compte est créé : ton numéro de membre est **{{numero}}**.\n\nTa carte membre et ton attestation seront **validées dès que ton adhésion {{saison}} sera réglée**. Tu peux finaliser ton paiement à tout moment depuis ton espace membre." },
  {
    id: "membership_welcome",
    key: "membership_welcome",
    name: "Bienvenue (adhésion validée, avec l'espace privé)",
    subject: "Bienvenue chez Les Dames du Parc 🔴🔵",
    body: [
      "Bonjour **{{prenom}}**,",
      "# Bienvenue chez Les Dames du Parc !",
      "Nous sommes très heureuses de t’accueillir **officiellement** au sein de notre communauté de supportrices du **Paris Saint-Germain**.",
      "En rejoignant Les Dames du Parc pour la **saison {{saison_courte}}**, tu rejoins une communauté de femmes réunies par une même passion : **le Paris Saint-Germain**.",
      "## Tes avantages en tant qu’adhérente",
      "• **Un espace d’échange privilégié** entre adhérentes\n• **Des événements et rendez-vous réservés** aux membres tout au long de la saison\n• **Des goodies réservés** aux adhérentes",
      "## 📅 Ton adhésion",
      "Ton adhésion est valable pour **toute la saison {{saison_courte}}**, jusqu’au **{{fin}}**.",
      "{{#discord}}## 💬 Ton espace privé",
      "Pour échanger avec les autres Dames, suivre les informations réservées aux membres et faire vivre la communauté au quotidien, nous avons créé notre **espace privé**.",
      "[👉 Rejoindre l’espace privé]({{discord}})",
      "N’hésite pas à nous y rejoindre **dès maintenant** !{{/discord}}",
      "Cette saison ne fait que commencer, et nous avons hâte de la vivre **avec toi**.",
      "**Bienvenue dans l’aventure Les Dames du Parc.**",
      "**Unies par la même passion.** 🔴🔵",
      "**Les Dames du Parc**\n> Communauté 100 % féminine de supportrices du Paris Saint-Germain",
    ].join("\n\n"),
  },
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
  { id: "new_article", key: "new_article", name: "Nouvel article publié (adhérentes)", subject: "Nouvel article : {{titre}}", body: "Bonjour {{prenom}},\n\nUn nouvel article vient d'être publié sur le site des Dames du Parc :\n\n{{titre}}\n{{resume}}\n\n{{lien}}" },
  { id: "new_event", key: "new_event", name: "Nouvel événement publié (adhérentes)", subject: "Nouvel événement : {{titre}}", body: "Bonjour {{prenom}},\n\nUn nouvel événement vient d'être publié :\n\n{{titre}}\n{{date}}, {{lieu}}\n{{resume}}\n\nLes adhérentes actives ont la priorité sur les inscriptions.\n\n{{lien}}" },
  { id: "new_product", key: "new_product", name: "Nouveau produit en boutique (adhérentes)", subject: "Nouveau à la boutique : {{titre}}", body: "Bonjour {{prenom}},\n\nUn nouveau produit vient d'arriver à la boutique des Dames du Parc :\n\n{{titre}}\n{{resume}}\nPrix : {{prix}}\n\n{{lien}}" },
  { id: "member_suspended", key: "member_suspended", name: "Suspension provisoire de l'adhésion", subject: "Ton adhésion est suspendue jusqu'au {{fin}}", body: "Bonjour {{prenom}},\n\nNous t'informons que ton adhésion aux Dames du Parc est suspendue à titre provisoire, jusqu'au {{fin}}.\n\nMotif : {{motif}}\n\nPendant cette période, ta carte de membre n'est pas valide et tu ne peux pas t'inscrire aux événements. Ton adhésion sera rétablie automatiquement à la date indiquée : tu n'as aucune démarche à faire, un e-mail te le confirmera.\n\nPour toute question ou pour présenter tes observations, réponds à ce message ou écris-nous à {{contact}}." },
  { id: "member_reinstated", key: "member_reinstated", name: "Adhésion rétablie", subject: "Ton adhésion est de nouveau active", body: "Bonjour {{prenom}},\n\nLa suspension de ton adhésion aux Dames du Parc est terminée : ton adhésion est de nouveau active, ta carte de membre est de nouveau valide et tu peux te réinscrire aux événements.\n\nÀ très vite au Parc. Une question : {{contact}}." },
  { id: "member_expelled", key: "member_expelled", name: "Radiation du groupe", subject: "Décision concernant ton adhésion aux Dames du Parc", body: "Bonjour {{prenom}},\n\nNous t'informons de ta radiation définitive de l'association Les Dames du Parc. Ton adhésion et ta carte de membre ne sont plus valides et l'accès à ton espace membre est fermé.\n\nMotif : {{motif}}\n\nTu peux présenter tes observations en écrivant à {{contact}}. Conformément au RGPD, tu peux aussi demander l'accès à tes données ou leur effacement depuis la page « Mes données » du site (les pièces comptables sont conservées le temps prévu par la loi)." },
  { id: "invoice_issued", key: "invoice_issued", name: "Paiement validé et facture (adhérente)", subject: "Paiement validé : facture {{numero}}", body: "Bonjour {{prenom}},\n\nNous avons bien reçu ton paiement de {{montant}} pour {{objet}}. Merci !\n\nTa facture n° {{numero}} est jointe à ce message. Tu la retrouveras aussi à tout moment dans ton espace membre, rubrique « Mes transactions »." },
  { id: "invoice_admin", key: "invoice_admin", name: "Paiement reçu (administratrices)", subject: "Paiement reçu : {{montant}} de {{nom}}", body: "Un paiement vient d'être validé.\n\nPersonne : {{nom}}\nObjet : {{objet}}\nMontant : {{montant}}\nMode de paiement : {{mode}}\nFacture n° {{numero}} (jointe)\n\nElle est conservée dans la fiche de la personne et dans Finances > Factures." },
  { id: "payment_link", key: "payment_link", name: "Lien de paiement de l'adhésion (paiement différé)", subject: "Finalisez votre adhésion aux Dames du Parc", body: "Bonjour {{prenom}},\n\nVotre compte est créé. Vous avez choisi de régler votre adhésion plus tard ({{montant}}).\n\nPour la payer en ligne à tout moment, connectez-vous puis suivez ce lien :\n\n{{lien}}\n\nSi vous préférez payer en espèces ou par chèque, votre carte de membre sera validée manuellement par l'équipe des Dames du Parc dès réception de votre règlement. Tant que le paiement n'est pas validé, votre carte reste « en cours de création » et son QR code « Adhésion invalide »." },
  { id: "payment_reminder", key: "payment_reminder", name: "Rappel : adhésion non réglée ou non validée", subject: "Votre adhésion aux Dames du Parc n'est pas encore validée", body: "Bonjour {{prenom}},\n\nIl y a {{jours}} jours, vous avez créé votre compte, mais votre adhésion ({{montant}}) n'est pas encore réglée ou validée par l'équipe.\n\nPour la payer en ligne :\n\n{{lien}}\n\nSi vous avez déjà remis un règlement en espèces ou par chèque, votre carte sera validée dès que l'équipe l'aura enregistré : inutile de faire quoi que ce soit." },
];

export const templates = collection<EmailTemplate>("email_templates", () => DEFAULT_TEMPLATES);

/** Ajoute les modèles introduits depuis la création du fichier (mises à jour du site). */
export async function ensureTemplates() {
  const all = await templates.all();
  const have = new Set(all.map((t) => t.key));
  for (const t of DEFAULT_TEMPLATES) if (!have.has(t.key)) await templates.insert(t as never);
  // Le message « welcome » (à la création du compte) reprenait le texte de bienvenue : il devient « Compte créé », la vraie bienvenue partant à la validation.
  const old = all.find((t) => t.key === "welcome");
  if (old && old.body.startsWith("Bonjour {{prenom}},\n\nBienvenue chez Les Dames du Parc. Ton adhésion")) {
    const next = DEFAULT_TEMPLATES.find((t) => t.key === "welcome")!;
    await templates.update(old.id, { name: next.name, subject: next.subject, body: next.body });
  }
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
  /** État de chaque page publique : en ligne, masquée (le menu se réorganise), en maintenance ou « bientôt disponible » */
  pageStates: {} as Record<string, { state: "live" | "hidden" | "maintenance" | "soon"; message?: string }>,
  /** Textes modifiés dans « Contenus des pages » (clé → texte) ; absent = texte d'origine */
  cms: {} as Record<string, string>,
});
