/**
 * Contenus de la page « Qui sommes-nous » (ex-« Le groupe ») : une seule page qui réunit ce qui était réparti en six chapitres,
 * chiffres clés, origine du projet, raison d'être d'un fan club 100 % féminin, valeurs et ambitions.
 */
export const groupe = {
  hero: {
    intro: "Les Dames du Parc sont la première communauté 100 % féminine de supportrices du Paris Saint-Germain : des femmes réunies par une même passion pour le club de la capitale, au Parc des Princes et bien au-delà.",
    button: "Découvrir notre histoire",
  },
  bento: {
    eyebrow: "En bref",
    title: "Une communauté née de 15 fondatrices",
    lead: "Avant d’ouvrir ses portes à toutes les supportrices du PSG, l’aventure des Dames du Parc s’est construite en petit comité. Voici, en quelques chiffres, ce qui nous définit aujourd’hui.",
    stats: [
      { value: "15", label: "fondatrices, réunies avant l’ouverture au public" },
      { value: "19–40", label: "ans : l’âge des fondatrices" },
      { value: "2026", label: "année de naissance du projet" },
      { value: "6", label: "valeurs qui nous rassemblent" },
    ],
  },
  origin: {
    eyebrow: "Notre histoire",
    title: "D’un message à une communauté : comment tout a commencé",
    paragraphs: [
      "Tout est parti d’une question posée en quelques mots, un soir, sur les réseaux sociaux : « Et si on créait un groupe de supportrices du PSG ? » Une idée simple, presque anodine, qui allait pourtant donner naissance à la première communauté 100 % féminine de supportrices du Paris Saint-Germain.",
      "Quinze femmes ont répondu présentes : des étudiantes, des cadres, des salariées, des mères, toutes différentes par leur âge, leur métier, leur parcours, mais unies par la même émotion quand Paris entre sur la pelouse. Les échanges se sont vite transformés en habitudes, et les soirs de match en rendez-vous.",
      "Puis est venue la finale de la Ligue des Champions 2025, vécue ensemble : au stade, devant un écran ou en watch party. Un moment qui a scellé ce qui n’était encore qu’un groupe de discussion. Les retrouvailles autour d’un restaurant ou d’une terrasse ont mis des visages sur les prénoms, et une véritable communauté est née, bien avant de porter officiellement le nom des Dames du Parc.",
      "Aujourd’hui, ces 15 fondatrices ouvrent la communauté à toutes les supportrices qui partagent leur passion pour le Paris Saint-Germain, avec une ambition claire : la faire grandir sans jamais perdre ce qui a fait sa force, la rencontre.",
    ],
  },
  why: {
    eyebrow: "Notre positionnement",
    title: "Pourquoi un fan club 100 % féminin du Paris Saint-Germain ?",
    pull: "L’amour du club ne connaît pas de genre.",
    paragraphs: [
      "Les supportrices du PSG existent depuis toujours : dans les tribunes, devant leur écran, dans les rues de Paris un soir de match. Pourtant, elles restent souvent invisibles, sans espace qui leur ressemble ni communauté organisée pour les rassembler. Les Dames du Parc ne sont pas nées d’une volonté de se séparer des autres supporters, mais de donner enfin une forme à ce qui existait déjà.",
      "Beaucoup de femmes vivent encore leur passion seules : difficile de trouver quelqu’un avec qui commenter un match, d’oser pousser les portes du Parc des Princes sans se sentir en décalage, ou simplement d’assumer sa passion sans avoir à se justifier. Notre communauté répond à ce besoin très concret : un espace de rencontre où chacune peut vivre le PSG pleinement, entourée d’autres supportrices.",
      "C’est aussi un repère pour les jeunes filles qui grandissent avec cette passion et qui, faute de représentation féminine dans les tribunes, pourraient croire que cet univers ne leur est pas destiné. En Europe, le modèle a déjà fait ses preuves : les Bayern Red Ladies rassemblent plus de 350 membres dans plus de 20 pays. Les Dames du Parc s’inscrivent dans cette même dynamique, aux couleurs de Paris.",
    ],
  },
  values: {
    eyebrow: "Ce qui nous rassemble",
    title: "Nos valeurs",
    items: [
      { title: "Passion", text: "Le PSG n’est pas un loisir, c’est un rendez-vous." },
      { title: "Fidélité", text: "Présentes quand ça gagne, présentes quand c’est difficile." },
      { title: "Bienveillance", text: "Ici, chacune a sa place." },
      { title: "Sororité", text: "On vient pour le PSG, on reste pour elles." },
      { title: "Transmission", text: "Une passion qui se partage, d’une génération à l’autre." },
      { title: "Engagement", text: "On ne se contente pas de regarder : on organise, on crée, on rassemble." },
    ],
  },
  build: {
    eyebrow: "Notre ambition",
    title: "Ce que nous voulons construire",
    items: [
      { title: "Se retrouver", text: "Des rendez-vous réguliers autour des matchs : au Parc, en déplacement, en watch party." },
      { title: "Participer à la vie du club", text: "Participer aux initiatives du Paris Saint-Germain et représenter ses valeurs avec fierté." },
      { title: "Grandir sans frontières", text: "De la région parisienne à la France, puis au monde, avec les réseaux et un espace privé." },
      { title: "Changer le regard", text: "Normaliser la place des supportrices dans les tribunes et dans la culture du club." },
    ],
  },
} as const;
