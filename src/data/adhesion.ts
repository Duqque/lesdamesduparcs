/**
 * Contenus de la page « Communauté & adhésion » (saison 2026-2027), partie destinée au public.
 * Volontairement resserré à ce qui doit être compris en quelques secondes : la communauté reste ouverte à toutes, l'adhésion est pour
 * celles qui veulent aller plus loin, son tarif, ses avantages actuels et le parcours pour devenir membre. Le reste (réflexions internes,
 * fonctionnement de gestion, évolutions futures) n'a pas sa place ici.
 */
export const adhesion = {
  community: {
    title: "Communauté",
    lead: "Une communauté ouverte à toutes les supportrices du PSG.",
    text: "Suivre nos actualités, découvrir nos contenus, échanger avec nous et participer aux événements ouverts au public.",
  },
  members: {
    title: "Membre adhérente",
    lead: "Celles qui souhaitent aller plus loin peuvent adhérer aux Dames du Parc pour la saison et devenir officiellement membres de la communauté.",
    text: "Adhérer pour la saison, devenir officiellement membre et accéder aux avantages et à l’espace réservés aux adhérentes.",
  },
  why: "Pour aller plus loin dans l’aventure Les Dames du Parc et vivre la communauté de l’intérieur.",
  // Uniquement ce qui est décidé pour cette première saison ; la page évoluera lorsque de nouveaux avantages seront réellement mis en place.
  benefits: [
    { icon: "MessageCircle", title: "Un espace d’échange privilégié", text: "Un espace privé entre adhérentes pour échanger et recevoir les informations réservées aux membres." },
    { icon: "Ticket", title: "Des événements réservés aux membres", text: "Des rendez-vous et moments privilégiés tout au long de la saison." },
    { icon: "ShoppingBag", title: "Des goodies réservés aux adhérentes", text: "Des attentions pensées spécialement pour les membres." },
    { icon: "IdCard", title: "Une carte de membre virtuelle", text: "Une carte personnelle permettant d’identifier ton adhésion." },
  ],
  price: {
    amount: 12,
    season: "2026-2027",
    lead: "12 € pour toute la saison 2026-2027.",
    validUntil: "Ton adhésion est valable jusqu’au 30 juin 2027 à 23h59.",
    renewal: "Le renouvellement n’est pas automatique. À l’issue de la saison, chaque adhérente devra renouveler elle-même son adhésion pour continuer à bénéficier des avantages réservés aux membres.",
  },
  steps: [
    { title: "Je découvre Les Dames du Parc", text: "Instagram, TikTok, événements, médias, bouche-à-oreille…" },
    { title: "Je remplis mon formulaire d’adhésion", text: "Les informations nécessaires pour créer mon adhésion." },
    { title: "Je règle mon adhésion de 12 €", text: "12 € pour la saison 2026-2027." },
    { title: "Je reçois ma confirmation et accède à mon espace membre", text: "Carte de membre et avantages réservés aux adhérentes." },
  ],
  privateSpace: {
    lead: "Un espace réservé aux adhérentes pour échanger, retrouver les informations réservées aux membres et faire vivre la communauté au quotidien.",
    cta: "Accéder à l’espace privé",
  },
  final: "Bienvenue chez Les Dames du Parc.\nUnies par la même passion. 🔴🔵",
} as const;
