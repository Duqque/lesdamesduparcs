/** « Le groupe » en six parties courtes : qui nous sommes, sans détour. */
export const groupe = {
  letter: {
    statement: "Nous sommes 22 supportrices du Paris Saint-Germain. Nous ne nous connaissions pas. Le PSG nous a réunies.",
    pull: "Sans le savoir, le Paris Saint-Germain nous avait déjà réunies.",
    paragraphs: [
      "Un message a suffi : « Et si on créait un groupe de supportrices du PSG ? » Les conversations sont devenues des habitudes, les soirs de match des rendez-vous.",
      "Aujourd’hui, nous nous retrouvons au Parc, devant l’écran, et bien au-delà des jours de match.",
    ],
  },
  story: [
    { title: "Un message", text: "« Et si on créait un groupe de supportrices du PSG ? »" },
    { title: "Un groupe", text: "Les discussions dépassent le football : nous apprenons à nous connaître." },
    { title: "La finale", text: "Au stade, devant un écran ou en watch party, nous vivons la finale de la Ligue des Champions ensemble." },
    { title: "Les retrouvailles", text: "Un restaurant, une terrasse : nous mettons enfin des visages sur les prénoms." },
    { title: "Une communauté", text: "Watch parties, sorties au Parc, Stadium Tour : le groupe vit bien au-delà des réseaux." },
  ],
  who: {
    lead: "Étudiantes, cadres, salariées, mères, créatrices de contenu. Différentes par l’âge, le métier, le parcours. Unies par la même émotion quand le PSG entre sur la pelouse.",
    figures: [
      { count: 22, label: "supportrices, de 19 à 40 ans" },
      { count: 22, label: "membres MyParis" },
      { count: 10, label: "cartes Collectif Ultras Paris 26/27" },
      { count: 1, label: "abonnée au Parc des Princes" },
      { count: null, value: "2026", label: "année de fondation" },
    ],
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
      { title: "Un espace pour elles", text: "Les supportrices existent depuis toujours, mais restent souvent invisibles. Un fan club donne une forme à ce qui existe déjà." },
      { title: "Un espace de rencontre", text: "Beaucoup vivent leur passion seules. Ici, plus besoin de franchir seule les portes du Parc." },
      { title: "Un espace qui dure", text: "Un repère pour les jeunes supportrices d’aujourd’hui et de demain." },
      { title: "Un modèle éprouvé", text: "Les Bayern Red Ladies réunissent plus de 350 membres dans plus de 20 pays." },
    ],
  },
  build: [
    { title: "Se retrouver", text: "Des rendez-vous réguliers autour des matchs : au Parc, en déplacement, en watch party." },
    { title: "Être actrices du club", text: "Participer aux projets du Paris Saint-Germain et le représenter avec fierté." },
    { title: "Grandir sans frontières", text: "De la région parisienne à la France, puis au monde, avec les réseaux et un espace privé." },
    { title: "Changer le regard", text: "Normaliser la place des supportrices dans les tribunes et dans la culture du club." },
  ],
} as const;
