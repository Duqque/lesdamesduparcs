/** « Le groupe » en six parties courtes : qui nous sommes, sans détour. */
export const groupe = {
  letter: {
    statement: "Nous étions 15 supportrices du Paris Saint-Germain. Nous ne nous connaissions pas. Le PSG nous a réunies.",
    pull: "Sans le savoir, le Paris Saint-Germain nous avait déjà réunies.",
    paragraphs: [
      "Un message a suffi : « Et si on créait un groupe de supportrices du PSG ? » Les conversations sont devenues des habitudes, les soirs de match des rendez-vous.",
      "Avant de devenir publique, l’aventure des Dames du Parc s’est construite autour de 15 membres historiques, réunies par la même passion pour le Paris Saint-Germain.",
      "Aujourd’hui, nous nous retrouvons au Parc, devant l’écran, et bien au-delà des jours de match. La communauté a vocation à accueillir de nouvelles adhérentes.",
    ],
  },
  /** Ouverture de « Notre histoire » : la construction du projet avant son ouverture au public. */
  storyIntro: "Avant de devenir publique, l’aventure des Dames du Parc s’est construite autour de 15 membres historiques, réunies par la même passion pour le Paris Saint-Germain.",
  story: [
    { title: "Un message", text: "« Et si on créait un groupe de supportrices du PSG ? »" },
    { title: "Un groupe", text: "Les discussions dépassent le football : nous apprenons à nous connaître." },
    { title: "La finale", text: "Au stade, devant un écran ou en watch party, nous vivons la finale de la Ligue des Champions ensemble." },
    { title: "Les retrouvailles", text: "Un restaurant, une terrasse : nous mettons enfin des visages sur les prénoms." },
    { title: "Une communauté", text: "Watch parties, sorties au Parc, Stadium Tour : la communauté vit bien au-delà des réseaux, et s’ouvre aujourd’hui à de nouvelles adhérentes." },
  ],
  who: {
    lead: "Étudiantes, cadres, salariées, mères, créatrices de contenu. Différentes par l’âge, le métier, le parcours. Unies par la même émotion quand le PSG entre sur la pelouse.",
    /** Chiffres des seules membres historiques (présentes dans la construction du projet, avant son ouverture au public). */
    figures: [
      { count: 15, label: "membres historiques, présentes dès la construction du projet" },
      { count: null, value: "19–40", label: "ans : l’âge des membres historiques" },
      { count: null, value: "2026", label: "année de fondation" },
    ],
    passion: "Une même passion pour le Paris Saint-Germain.",
    note: "Ces 15 femmes étaient là avant l’ouverture au public. Aujourd’hui, la communauté a vocation à accueillir de nouvelles adhérentes.",
  },
  values: [
    { title: "Passion", text: "Le PSG n’est pas un loisir, c’est un rendez-vous." },
    { title: "Fidélité", text: "Présentes quand ça gagne, présentes quand c’est difficile." },
    { title: "Bienveillance", text: "Ici, chacune a sa place." },
    { title: "Sororité", text: "On vient pour le PSG, on reste pour elles." },
    { title: "Transmission", text: "Une passion qui se partage, d’une génération à l’autre." },
    { title: "Engagement", text: "On ne se contente pas de regarder : on organise, on crée, on rassemble." },
  ],
  why: {
    pull: "L’amour du club ne connaît pas de genre.",
    items: [
      { title: "Un espace pour elles", text: "Les supportrices existent depuis toujours, mais restent souvent invisibles. Une communauté donne une forme à ce qui existe déjà." },
      { title: "Un espace de rencontre", text: "Beaucoup vivent leur passion seules. Ici, plus besoin de franchir seule les portes du Parc." },
      { title: "Un espace qui dure", text: "Un repère pour les jeunes supportrices d’aujourd’hui et de demain." },
      { title: "Un modèle éprouvé", text: "Les Bayern Red Ladies réunissent plus de 350 membres dans plus de 20 pays." },
    ],
  },
  build: [
    { title: "Se retrouver", text: "Des rendez-vous réguliers autour des matchs : au Parc, en déplacement, en watch party." },
    { title: "Participer à la vie du club", text: "Participer aux initiatives du Paris Saint-Germain et représenter ses valeurs avec fierté." },
    { title: "Grandir sans frontières", text: "De la région parisienne à la France, puis au monde, avec les réseaux et un espace privé." },
    { title: "Changer le regard", text: "Normaliser la place des supportrices dans les tribunes et dans la culture du club." },
  ],
} as const;
