import type { ClubEvent } from "@/types";

/**
 * Événements fictifs pour la maquette (dates, lieux, tarifs et intervenants à confirmer).
 * Seuls la présence de Priscilla Gneto (judo, PSG Judo) et le cadre du programme « Allez les filles »
 * (filles de 11 à 16 ans, PSG For Communities) s'appuient sur l'article officiel du PSG.
 */
export const events: ClubEvent[] = [
  {
    id: "psg-om-classique",
    title: "Le Classique au Parc",
    subtitle: "Paris Saint-Germain contre l'Olympique de Marseille, en tribune avec les Dames du Parc.",
    tag: "Matchday",
    date: "2026-10-17",
    time: "18:30",
    endTime: "23:30",
    venue: "Parc des Princes",
    address: "24 rue du Commandant Guilbaud, 75016 Paris",
    image: "/images/parc-pelouse-tribunes.webp",
    imageAlt: "La pelouse et les tribunes du Parc des Princes avant le coup d'envoi",
    variant: "photo",
    access: "Billetterie membres",
    summary: "Rendez-vous avant le coup d'envoi pour un Classique qui se vit debout, écharpe au vent.",
    registration: { mode: "external", priceCents: 0, capacity: 0 },
    description: [
      "Il est des affiches qui dépassent le simple cadre d'un match. Le Classique en fait partie. Les Dames du Parc se retrouvent ensemble pour l'occasion, en tribune, avec l'ambition de faire du Parc des Princes une chaudière.",
      "Rendez-vous est donné en amont de la rencontre pour récupérer sa place, découvrir les nouveaux chants et avancer groupées jusqu'aux portiques.",
    ],
    program: [
      { time: "18:30", title: "Point de rendez-vous", text: "Retrouvailles aux abords du Parc, remise des places et des écharpes." },
      { time: "19:30", title: "Répétition des chants", text: "Un dernier échauffement collectif avant l'entrée en tribune." },
      { time: "21:00", title: "Coup d'envoi", text: "Paris reçoit Marseille. Toutes les voix comptent." },
    ],
    speakers: [],
    practical: [
      { label: "Public", value: "Membres des Dames du Parc et invitées" },
      { label: "Tarif", value: "Selon la catégorie de place" },
      { label: "Accès", value: "Métro Porte de Saint-Cloud ou Michel-Ange Auteuil" },
      { label: "À prévoir", value: "Écharpe, pièce d'identité, billet" },
    ],
    href: "/billetterie",
  },
  {
    id: "soiree-des-dames",
    title: "Soirée des Dames",
    subtitle: "La grande soirée de rentrée des supportrices, dans l'esprit du Parc.",
    tag: "Soirée",
    date: "2026-10-24",
    time: "20:00",
    endTime: "01:00",
    venue: "Bar du Parc",
    address: "Paris 16e, adresse communiquée aux inscrites",
    image: "/images/identite-silhouettes.webp",
    imageAlt: "Silhouettes de supportrices, écharpes levées, sur fond bleu nuit",
    variant: "photo",
    access: "Membres",
    summary: "Une soirée pour se retrouver, chanter et refaire le match entre supportrices.",
    registration: { mode: "form", priceCents: 1000, capacity: 80 },
    description: [
      "La Soirée des Dames est le rendez-vous convivial de la saison. On y retrouve des visages familiers, on fait de nouvelles rencontres et l'on chante bien plus fort que la musique.",
      "Au programme : ambiance de tribune, jeux autour du PSG, tombola aux couleurs du club et surprises réservées aux membres.",
    ],
    program: [
      { time: "20:00", title: "Ouverture des portes", text: "Accueil des membres et remise des bracelets." },
      { time: "21:00", title: "Quiz et jeux PSG", text: "Par équipes, autour de l'histoire du club et de ses joueuses et joueurs." },
      { time: "22:30", title: "Chants et tombola", text: "Le répertoire des Dames du Parc, puis le tirage au sort." },
    ],
    speakers: [],
    practical: [
      { label: "Public", value: "Membres et une invitée par membre" },
      { label: "Tarif", value: "Entrée réservée aux membres" },
      { label: "À prévoir", value: "Carte membre, tenue aux couleurs de Paris" },
    ],
    href: "/billetterie",
  },
  {
    id: "atelier-chants",
    title: "Atelier chants",
    subtitle: "Apprendre le répertoire et faire vibrer les tribunes.",
    tag: "Atelier",
    date: "2026-10-31",
    time: "15:00",
    endTime: "17:30",
    venue: "Salle des Dames",
    address: "Paris, lieu à confirmer",
    image: "/images/identite-logo.webp",
    imageAlt: "Logo des Dames du Parc sur fond bleu nuit",
    variant: "text",
    access: "Sur inscription",
    summary: "Deux heures pour maîtriser les chants du groupe, débutantes bienvenues.",
    registration: { mode: "form", priceCents: 0, capacity: 30 },
    description: [
      "Chanter en tribune s'apprend. Cet atelier propose de découvrir les chants des Dames du Parc, les paroles comme les rythmes, dans une ambiance détendue.",
      "Aucune expérience n'est requise : il suffit d'avoir envie de mettre de la voix au service de Paris.",
    ],
    program: [
      { time: "15:00", title: "Échauffement vocal", text: "Respiration, souffle et mise en voix." },
      { time: "15:45", title: "Le répertoire", text: "Apprentissage des chants, un par un." },
      { time: "17:00", title: "Grand final", text: "Tous les chants d'affilée, comme un soir de match." },
    ],
    speakers: [],
    practical: [
      { label: "Public", value: "Toutes les supportrices, débutantes comprises" },
      { label: "Tarif", value: "Gratuit pour les membres" },
      { label: "Places", value: "30 places" },
    ],
    href: "/billetterie",
  },
  {
    id: "allez-les-filles-dojo",
    title: "Allez les filles au dojo du PSG",
    subtitle: "Une journée sportive avec Priscilla Gneto, puis cap sur le Parc des Princes.",
    tag: "Programme",
    date: "2026-11-08",
    time: "10:30",
    endTime: "19:30",
    venue: "Dojo du PSG Judo",
    address: "Le Plessis-Robinson, adresse précise communiquée aux inscrites",
    image: "/images/tunnel-ici-cest-paris.webp",
    imageAlt: "Le couloir lumineux du Parc des Princes, Ici c'est Paris",
    variant: "photo",
    access: "Sur inscription",
    summary: "Initiation au judo, rencontres d'athlètes et match au Parc des Princes pour des jeunes filles de 11 à 16 ans.",
    registration: { mode: "form", priceCents: 0, capacity: 40, guardianRequired: true, minAge: 11, maxAge: 16, singlePlace: true },
    description: [
      "Cette journée s'inscrit dans l'esprit du programme « Allez les filles » du PSG, mené par PSG For Communities pour permettre à des jeunes filles de découvrir les bienfaits du sport, de gagner en confiance et de s'ouvrir à la culture.",
      "Le matin, le dojo du PSG Judo devient le terrain de jeu du groupe. Priscilla Gneto, judoka médaillée olympique et marraine du programme, guide une initiation puis échange avec les participantes. L'après-midi, des athlètes du club prennent le relais pour partager leur parcours.",
      "La journée se poursuit en navette jusqu'au Parc des Princes, accompagnées par des joueuses des féminines du PSG et par les Dames du Parc. Visite des coulisses, puis match en tribune : de quoi transformer une journée de sport en souvenir durable.",
    ],
    program: [
      { time: "10:30", title: "Accueil au dojo", text: "Petit déjeuner, remise des tenues et présentation de la journée." },
      { time: "11:00", title: "Initiation au judo", text: "Un cours d'initiation animé par Priscilla Gneto, sur le tatami du PSG Judo." },
      { time: "12:30", title: "Déjeuner partagé", text: "Un temps d'échange informel avec les intervenantes et les bénévoles." },
      { time: "13:30", title: "Rencontres d'athlètes", text: "Témoignages, questions et conseils de sportives et sportifs du club." },
      { time: "14:45", title: "Départ en navette", text: "Direction le Parc des Princes, en compagnie des joueuses des féminines et des Dames du Parc." },
      { time: "15:45", title: "Visite des coulisses", text: "Vestiaires, tunnel et pelouse : le stade comme on ne le voit jamais." },
      { time: "17:00", title: "Match au Parc des Princes", text: "Coup d'envoi en tribune, écharpe au cou et voix prête à porter Paris." },
      { time: "19:30", title: "Retour et fin de journée", text: "Retour organisé vers le point de départ." },
    ],
    speakers: [
      {
        name: "Priscilla Gneto",
        role: "Judoka, médaillée olympique, marraine du programme",
        bio: "Sportive du PSG Judo, elle accompagne le programme « Allez les filles » par sa simplicité et sa disponibilité. Elle incarne les valeurs de dépassement de soi et de confiance portées par la journée.",
        initials: "PG",
      },
      {
        name: "Athlètes du club",
        role: "Interventions et témoignages",
        bio: "Des sportives et sportifs du Paris Saint-Germain viendront partager leur parcours. La liste complète sera dévoilée avant l'événement.",
        initials: "AT",
      },
      {
        name: "Joueuses des féminines",
        role: "Accompagnement jusqu'au Parc des Princes",
        bio: "Des joueuses du PSG Féminines escorteront le groupe pour la visite du stade et le match. Présence à confirmer.",
        initials: "PF",
      },
    ],
    practical: [
      { label: "Public", value: "Filles de 11 à 16 ans, avec autorisation parentale" },
      { label: "Tarif", value: "Gratuit, sur inscription" },
      { label: "Places", value: "40 places" },
      { label: "Transport", value: "Navette collective aller-retour vers le Parc des Princes" },
      { label: "À prévoir", value: "Tenue de sport, chaussettes propres, pièce d'identité" },
      { label: "Organisation", value: "En lien avec PSG For Communities et les Dames du Parc" },
    ],
    href: "/billetterie",
  },
  {
    id: "rencontre-des-membres",
    title: "Rencontre des membres",
    subtitle: "Un après-midi pour faire connaissance et façonner la saison à venir.",
    tag: "Membres",
    date: "2026-11-22",
    time: "16:00",
    endTime: "19:00",
    venue: "Maison des Dames",
    address: "Paris, lieu à confirmer",
    image: "/images/vestiaire-fauteuils.webp",
    imageAlt: "Rangée de fauteuils bleus dans un vestiaire du PSG",
    variant: "text",
    access: "Membres",
    summary: "Échanges, idées et projets : les membres construisent la suite de la saison.",
    registration: { mode: "form", priceCents: 0, capacity: 60 },
    description: [
      "Chaque saison, les membres se retrouvent pour dresser un premier bilan et proposer des idées : déplacements, soirées, actions solidaires.",
      "L'occasion aussi d'accueillir les nouvelles arrivées et de mettre des visages sur les pseudonymes des réseaux.",
    ],
    program: [
      { time: "16:00", title: "Accueil", text: "Café, gâteaux et retrouvailles." },
      { time: "16:30", title: "Bilan et idées", text: "Prise de parole libre et vote des projets." },
      { time: "18:00", title: "Moment convivial", text: "Photo de groupe et verre de l'amitié." },
    ],
    speakers: [],
    practical: [
      { label: "Public", value: "Membres des Dames du Parc" },
      { label: "Tarif", value: "Gratuit" },
      { label: "Places", value: "60 places" },
    ],
    href: "/rejoindre-le-groupe",
  },
  {
    id: "deplacement-en-car",
    title: "Déplacement en car",
    subtitle: "Suivre Paris loin de la capitale, en bande et en chansons.",
    tag: "Déplacement",
    date: "2026-12-06",
    time: "09:00",
    endTime: "23:00",
    venue: "Départ de Paris",
    address: "Point de départ communiqué aux inscrites",
    image: "/images/drapeau-fumee-verte.webp",
    imageAlt: "Drapeau du PSG flottant dans une fumée turquoise",
    variant: "photo",
    access: "Sur inscription",
    summary: "Une journée de match à l'extérieur, du car au retour, entre supportrices.",
    registration: { mode: "form", priceCents: 3500, capacity: 50 },
    description: [
      "Suivre Paris à l'extérieur change la façon de vivre une rencontre. Le car devient un salon roulant, les chants font le trajet avec nous.",
      "La destination et le match seront annoncés dès la programmation officielle. Les places sont limitées et réservées en priorité aux membres.",
    ],
    program: [
      { time: "09:00", title: "Départ", text: "Embarquement à Paris, remise des consignes et du programme." },
      { time: "14:00", title: "Arrivée et ambiance", text: "Déjeuner, puis marche groupée jusqu'au stade." },
      { time: "23:00", title: "Retour à Paris", text: "Arrivée prévue en fin de soirée." },
    ],
    speakers: [],
    practical: [
      { label: "Public", value: "Membres, à partir de 16 ans" },
      { label: "Tarif", value: "Participation aux frais de transport" },
      { label: "Places", value: "50 places" },
    ],
    href: "/billetterie",
  },
];

/*
 * ---------- Soirées « on regarde le match ensemble » (Watch Parties), saison 2026-2027 ----------
 * Source : calendrier « Watch_parties_PSG » transmis par l'association. Seules les rencontres confirmées sont reprises ; les
 * rencontres annulées (PSG-Strasbourg, PSG-Le Havre, PSG-Troyes, OGC Nice-PSG, PSG-Lorient, Toulouse-PSG) ne sont pas publiées.
 * Chaque soirée liée à un match du calendrier officiel (voir psg-calendar.ts) est reliée automatiquement à ce match
 * (src/lib/server/matches.ts, WATCH_PARTY_EVENT_IDS) : sa carte affiche alors un lien vers cette page.
 * PSG Féminine - OL (18/10) n'a pas de match correspondant dans le calendrier (masculin) du club : pas de lien.
 * Écart constaté avec le calendrier officiel pour PSG - OL (20h45 dans le document transmis, 21h45 dans psg-calendar.ts) : à vérifier
 * auprès du club avant publication, l'heure du document transmis est reprise ici en attendant.
 */
type WatchPartySeed = { id: string; label: string; date: string; time: string; venue: string; stadium?: boolean; image: string; imageAlt: string };

const addMinutes = (time: string, minutes: number) => {
  const [h, m] = time.split(":").map(Number);
  const total = (h * 60 + m + minutes) % 1440;
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
};

const watchParty = (e: WatchPartySeed): ClubEvent => ({
  id: e.id,
  title: e.stadium ? e.label : `Watch party : ${e.label}`,
  subtitle: e.stadium ? `Vivre ${e.label} ensemble, au Parc des Princes.` : `Suivre ${e.label} ensemble, avec les Dames du Parc.`,
  tag: "Matchday",
  date: e.date,
  time: e.time,
  endTime: addMinutes(e.time, 150),
  venue: e.venue,
  address: e.stadium ? "24 rue du Commandant Guilbaud, 75016 Paris" : "Adresse communiquée aux inscrites",
  image: e.image,
  imageAlt: e.imageAlt,
  variant: "photo",
  access: e.stadium ? "Billetterie membres" : "Sur inscription",
  summary: e.stadium ? `Un rendez-vous au Parc des Princes pour vivre ${e.label} ensemble.` : `Retrouvez les Dames du Parc pour suivre ${e.label} toutes ensemble.`,
  registration: e.stadium ? { mode: "external", priceCents: 0, capacity: 0 } : { mode: "form", priceCents: 0, capacity: 0 },
  description: e.stadium
    ? [`${e.label}, au Parc des Princes. Les Dames du Parc s'y retrouvent pour vivre la rencontre ensemble, en tribune.`, "Informations de rendez-vous communiquées aux inscrites."]
    : [`Rendez-vous pour suivre ${e.label} toutes ensemble, dans la bonne humeur.`, "Lieu précis et détails pratiques communiqués aux inscrites avant le match."],
  program: [],
  speakers: [],
  // « Lieu » n'est pas répété ici : la page l'affiche déjà à partir de venue/address.
  practical: [{ label: "Public", value: e.stadium ? "Membres, billetterie du club" : "Toutes les supportrices, sur inscription" }],
  href: "/billetterie",
});

export const watchParties: ClubEvent[] = [
  { id: "watch-party-le-mans", label: "PSG - Le Mans", date: "2026-10-10", time: "20:45", venue: "Bar bistrot 79", image: "/images/tunnel-ici-cest-paris.webp", imageAlt: "Le couloir lumineux du Parc des Princes, Ici c'est Paris" },
  { id: "watch-party-manchester-city", label: "Manchester City - PSG", date: "2026-10-14", time: "21:00", venue: "Bar bistrot 79", image: "/images/sieges-rouges-bleus.webp", imageAlt: "Sièges rouges et bleus floqués Paris Saint-Germain" },
  { id: "watch-party-feminines-ol", label: "PSG Féminine - OL", date: "2026-10-18", time: "21:00", venue: "Parc des Princes", stadium: true, image: "/images/parc-pelouse-tribunes.webp", imageAlt: "La pelouse du Parc des Princes face aux tribunes" },
  { id: "watch-party-fc-barcelone", label: "PSG - FC Barcelone", date: "2026-10-20", time: "21:00", venue: "Salle des Dames", image: "/images/identite-logo.webp", imageAlt: "Logo des Dames du Parc sur fond bleu nuit" },
  { id: "watch-party-lyon", label: "PSG - OL", date: "2026-10-25", time: "20:45", venue: "Salle des Dames", image: "/images/vestiaire-fauteuils.webp", imageAlt: "Rangée de fauteuils bleus dans un vestiaire du PSG" },
  { id: "watch-party-villarreal", label: "Villarreal - PSG", date: "2026-11-03", time: "21:00", venue: "Bar bistrot 79", image: "/images/parc-des-princes-facade.webp", imageAlt: "Façade en béton du Parc des Princes" },
  { id: "watch-party-as-roma", label: "PSG - AS Roma", date: "2026-11-25", time: "21:00", venue: "Salle des Dames", image: "/images/drapeau-paris-gros-plan.webp", imageAlt: "Gros plan sur un drapeau Paris Saint-Germain porté par la foule" },
  { id: "watch-party-aston-villa", label: "Aston Villa - PSG", date: "2026-12-08", time: "21:00", venue: "Salle des Dames", image: "/images/echarpe-fiere-parisienne.webp", imageAlt: "Écharpe « Fière d'être Parisienne » des Dames du Parc" },
  { id: "watch-party-paris-fc", label: "PSG - Paris FC", date: "2026-12-12", time: "20:45", venue: "Parc des Princes", stadium: true, image: "/images/parc-pelouse-tribunes.webp", imageAlt: "La pelouse du Parc des Princes face aux tribunes" },
].map(watchParty);

/* ---------- Événements passés (fictifs) ---------- */

type PastSeed = { id: string; title: string; date: string; venue: string; image: string; imageAlt: string; text: string };

const pastEvent = (e: PastSeed): ClubEvent => ({
  id: e.id,
  title: e.title,
  subtitle: e.text,
  tag: "Membres",
  date: e.date,
  time: "18:00",
  endTime: "22:00",
  venue: e.venue,
  address: "Paris",
  image: e.image,
  imageAlt: e.imageAlt,
  variant: "photo",
  access: "Terminé",
  summary: e.text,
  registration: { mode: "closed", priceCents: 0, capacity: 0 },
  description: [e.text, "Merci à toutes les supportrices qui ont fait de ce rendez-vous un beau moment. Retrouvez les prochains événements dans le calendrier."],
  program: [
    { time: "18:00", title: "Accueil", text: "Retrouvailles et remise des bracelets." },
    { time: "19:00", title: "Le temps fort", text: e.text },
  ],
  speakers: [],
  practical: [{ label: "Statut", value: "Événement terminé" }],
  href: "/evenements",
});

export const pastEvents: ClubEvent[] = [
  { id: "soiree-de-rentree", title: "Soirée de rentrée des membres", date: "2026-09-20", venue: "Bar du Parc", image: "/images/identite-silhouettes.webp", imageAlt: "Silhouettes de supportrices, écharpes levées, sur fond bleu nuit", text: "Une soirée pour lancer la saison, accueillir les nouvelles membres et chanter ensemble." },
  { id: "deplacement-marseille", title: "Déplacement à Marseille", date: "2026-09-13", venue: "Départ de Paris", image: "/images/parc-des-princes-facade.webp", imageAlt: "Façade en béton du Parc des Princes", text: "Une journée de match à l'extérieur, du car au retour, entre supportrices." },
  { id: "soiree-quiz-et-chants", title: "Soirée quiz et chants", date: "2026-09-06", venue: "Salle des Dames", image: "/images/vestiaire-fauteuils.webp", imageAlt: "Rangée de fauteuils bleus dans un vestiaire du PSG", text: "Quiz aux couleurs de Paris, répertoire de chants et tirage au sort." },
  { id: "tournoi-des-supportrices", title: "Tournoi de football des supportrices", date: "2026-08-29", venue: "Terrain de quartier", image: "/images/parc-pelouse-tribunes.webp", imageAlt: "La pelouse du Parc des Princes face aux tribunes", text: "Un tournoi amical entre équipes de membres, dans la bonne humeur." },
  { id: "projection-des-feminines", title: "Projection du match des féminines", date: "2026-08-15", venue: "Bar du Parc", image: "/images/tunnel-ici-cest-paris.webp", imageAlt: "Le couloir lumineux du Parc des Princes", text: "Le match des féminines du PSG sur grand écran, en compagnie des Dames du Parc." },
  { id: "pique-nique-parisien", title: "Pique-nique aux couleurs de Paris", date: "2026-07-12", venue: "Bois de Boulogne", image: "/images/identite-logo.webp", imageAlt: "Logo des Dames du Parc sur fond bleu nuit", text: "Un après-midi en plein air, drapeaux, jeux et goûter partagé." },
  { id: "assemblee-generale", title: "Assemblée générale des Dames du Parc", date: "2026-06-14", venue: "Maison des Dames", image: "/images/sieges-rouges-bleus.webp", imageAlt: "Sièges rouges et bleus floqués Paris Saint-Germain", text: "Bilan de la saison, projets et élection du bureau, avec toutes les membres." },
  { id: "finale-sur-ecran-geant", title: "Finale européenne sur écran géant", date: "2026-05-30", venue: "Fan zone", image: "/images/identite-lys.webp", imageAlt: "Fleur-de-lis et logo des Dames du Parc sur fond bleu nuit", text: "La finale vécue ensemble, sur écran géant, avec toute la communauté." },
].map(pastEvent);

export const eventTags = ["Tous", "Programme", "Matchday", "Soirée", "Atelier", "Membres", "Déplacement"] as const;

export const highlightedEventId = "allez-les-filles-dojo";

export const allEvents = () => [...events, ...watchParties, ...pastEvents];
export const getEvent = (id: string) => allEvents().find((e) => e.id === id);

/** Un événement est passé si sa date est antérieure à aujourd'hui (heure de Paris). */
export const isPast = (e: ClubEvent, now = new Date()) => e.date < new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Paris" }).format(now);

/** Événement mis en avant sur la page d'accueil. */
export const featuredEvent: ClubEvent = events.find((e) => e.id === "soiree-des-dames")!;
