import type { NewsItem } from "@/types";

/** Actualités fictives pour la maquette. */
export const news: NewsItem[] = [
  {
    id: "victoire-parc-en-fusion",
    title: "Victoire du PSG : un Parc en fusion !",
    category: "Match",
    date: "2026-09-20",
    image: "/images/ligue-des-champions-2025.webp",
    imageAlt: "Les joueurs du PSG célèbrent un titre sous une pluie de confettis dorés",
    excerpt: "Les tribunes ont grondé jusqu'au coup de sifflet final. Retour sur une soirée où Paris a su faire de son stade une forteresse.",
    content: [
      "Dès l'échauffement, l'ambiance était posée. Écharpes levées, chants repris en chœur, le Parc des Princes a rappelé à quel point un public uni peut soulever une équipe.",
      "Les Dames du Parc étaient là, réunies dans les tribunes, pour pousser Paris de la première à la dernière minute. Une soirée de ferveur qui rappelle pourquoi nous aimons tant ce club.",
      "Rendez-vous au prochain match pour prolonger l'élan, en chantant plus fort encore.",
    ],
    href: "/actualites/victoire-parc-en-fusion",
  },
  {
    id: "deplacement-marseille",
    title: "Les Dames du Parc au cœur du déplacement à Marseille",
    category: "Déplacement",
    date: "2026-09-13",
    image: "/images/parc-des-princes-facade.webp",
    imageAlt: "Façade en béton du Parc des Princes",
    excerpt: "Départ à l'aube, chants dans le car et tribune parée de rouge et de bleu : récit d'une journée entre supportrices.",
    content: [
      "Suivre Paris loin de chez soi change la manière de vivre une rencontre. Le car devient un salon roulant où les chants font le trajet avec nous.",
      "Sur place, les membres ont marché groupées jusqu'au stade, drapeaux au vent, avant de faire entendre la voix de Paris jusqu'au bout de la soirée.",
    ],
    href: "/actualites/deplacement-marseille",
  },
  {
    id: "retour-soiree-membre",
    title: "Retour sur notre soirée membre",
    category: "Événement",
    date: "2026-09-06",
    image: "/images/vestiaire-fauteuils.webp",
    imageAlt: "Rangée de fauteuils bleus dans un vestiaire du PSG",
    excerpt: "Quiz, chants et tombola : les images et les souvenirs d'une soirée qui a réuni les Dames du Parc.",
    content: [
      "La soirée membre a rassemblé des supportrices de tous horizons autour d'une même envie : se retrouver et refaire le match.",
      "Quiz aux couleurs de Paris, répertoire de chants et tirage au sort ont rythmé la soirée, dans une atmosphère chaleureuse.",
    ],
    href: "/actualites/retour-soiree-membre",
  },
  {
    id: "interview-une-membre",
    title: "Interview : une membre, une histoire",
    category: "Portrait",
    date: "2026-08-30",
    image: "/images/supportrices-parc-des-princes.webp",
    imageAlt: "Des supporters du PSG chantant dans les gradins",
    excerpt: "Elle raconte son premier match au Parc, son lien avec le club et ce que le groupe a changé dans sa manière de vivre le football.",
    content: [
      "Pour ce premier portrait, une membre revient sur son parcours de supportrice : le premier match, les frissons, les rencontres.",
      "Elle explique ce que représente le groupe pour elle, et pourquoi elle encourage chaque passionnée à franchir le pas.",
    ],
    href: "/actualites/interview-une-membre",
  },
  {
    id: "allez-les-filles-dojo",
    title: "Allez les filles : un dojo, un stade, une journée",
    category: "Programme",
    date: "2026-08-24",
    image: "/images/tunnel-ici-cest-paris.webp",
    imageAlt: "Le couloir lumineux du Parc des Princes, Ici c'est Paris",
    excerpt: "Initiation au judo avec Priscilla Gneto, rencontres d'athlètes puis cap sur le Parc des Princes : l'événement est ouvert aux inscriptions.",
    content: [
      "Dans l'esprit du programme « Allez les filles » du Paris Saint-Germain, une journée sportive et culturelle est organisée pour de jeunes filles de 11 à 16 ans.",
      "Au programme : une initiation au judo avec Priscilla Gneto, des échanges avec des athlètes du club, puis une visite du Parc des Princes et un match en tribune.",
      "Retrouvez tous les détails sur la page de l'événement, dans le calendrier.",
    ],
    href: "/actualites/allez-les-filles-dojo",
  },
  {
    id: "playlist-des-chants",
    title: "Nos chants enfin en playlist",
    category: "Musique",
    date: "2026-08-18",
    image: "/images/tribune-fumigene-orange.webp",
    imageAlt: "Supporters dans la lumière orange d'un fumigène",
    excerpt: "Apprenez le répertoire à votre rythme : la playlist des Dames du Parc est disponible, pour chanter avant, pendant et après le match.",
    content: [
      "Un chant se transmet : nous avons rassemblé nos titres préférés dans une playlist à écouter partout, dans le métro comme sur le trajet du Parc.",
      "Elle s'enrichira au fil de la saison. Les suggestions des membres sont les bienvenues.",
    ],
    href: "/actualites/playlist-des-chants",
  },
  {
    id: "carte-membre-wallet",
    title: "La carte membre arrive dans votre poche",
    category: "Adhésion",
    date: "2026-08-10",
    image: "/images/sieges-rouges-bleus.webp",
    imageAlt: "Sièges rouges et bleus floqués Paris Saint-Germain",
    excerpt: "Une carte à conserver, aussi belle en objet qu'en version numérique : découvrez ce qu'elle ouvre et comment la rejoindre.",
    content: [
      "La carte membre des Dames du Parc donne accès aux événements, aux avantages partenaires et à la vie de l'association.",
      "Bientôt disponible en version numérique, elle se glissera dans votre téléphone, prête à être présentée aux portes de nos rendez-vous.",
    ],
    href: "/actualites/carte-membre-wallet",
  },
];

export const getNews = (id: string) => news.find((n) => n.id === id);
