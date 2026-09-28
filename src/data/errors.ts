/** Pages d'erreur du site : titre, message et photo d'origine (photos du site, modifiables dans l'administration). */
export interface ErrorPage {
  slug: string;
  /** Texte affiché en grand (code HTTP ou mot court) */
  code: string;
  title: string;
  text: string;
  photo: string;
}

export const ERROR_PAGES: ErrorPage[] = [
  { slug: "400", code: "400", title: "Requête invalide", text: "La demande envoyée n’a pas pu être comprise. Revenez en arrière et réessayez.", photo: "/images/foule-drapeau-paris.webp" },
  { slug: "401", code: "401", title: "Authentification requise", text: "Connectez-vous à votre compte pour accéder à cette page.", photo: "/images/tunnel-ici-cest-paris.webp" },
  { slug: "403", code: "403", title: "Accès refusé", text: "Vous n’avez pas l’autorisation d’ouvrir cette page.", photo: "/images/vestiaire-fauteuils.webp" },
  { slug: "404", code: "404", title: "Page introuvable", text: "Cette page n’existe pas ou a été déplacée. Le ballon est sorti du terrain.", photo: "/images/parc-pelouse-tribunes.webp" },
  { slug: "408", code: "408", title: "Délai d’attente dépassé", text: "La requête a pris trop de temps. Vérifiez votre connexion et réessayez.", photo: "/images/sieges-rouges-bleus.webp" },
  { slug: "409", code: "409", title: "Conflit", text: "Cette action entre en conflit avec l’état actuel de la page ou de votre compte. Actualisez puis recommencez.", photo: "/images/drapeau-paris-gros-plan.webp" },
  { slug: "422", code: "422", title: "Données invalides", text: "Certaines informations envoyées ne sont pas valides. Vérifiez-les puis réessayez.", photo: "/images/vestiaire-maillots.webp" },
  { slug: "429", code: "429", title: "Trop de requêtes", text: "Vous avez fait trop de tentatives en peu de temps. Patientez quelques minutes avant de réessayer.", photo: "/images/tribune-fumigene-orange.webp" },
  { slug: "500", code: "500", title: "Erreur interne du serveur", text: "Un problème est survenu de notre côté. Notre équipe est prévenue, réessayez dans quelques instants.", photo: "/images/fans-drapeau-fumigene.webp" },
  { slug: "502", code: "502", title: "Serveur indisponible", text: "Le serveur a renvoyé une réponse incorrecte. Réessayez dans un instant.", photo: "/images/parc-des-princes-interieur.webp" },
  { slug: "503", code: "503", title: "Service temporairement indisponible", text: "Le service est momentanément indisponible. Merci de revenir un peu plus tard.", photo: "/images/parc-des-princes-facade.webp" },
  { slug: "504", code: "504", title: "Délai de réponse du serveur dépassé", text: "Le serveur met trop de temps à répondre. Réessayez dans quelques instants.", photo: "/images/drapeau-fumee-verte.webp" },
  { slug: "reseau", code: "Réseau", title: "Impossible de se connecter au serveur", text: "Vérifiez votre connexion Internet, puis réessayez.", photo: "/images/supportrices-parc-des-princes.webp" },
  { slug: "paiement", code: "Paiement", title: "Le paiement n’a pas pu être effectué", text: "Aucun montant n’a été débité. Vous pouvez réessayer, ou choisir un autre moyen de paiement.", photo: "/images/ligue-des-champions-2025.webp" },
  { slug: "remboursement", code: "Remboursement", title: "Le remboursement n’a pas pu être effectué", text: "Le remboursement n’a pas abouti. Contactez l’association en indiquant votre numéro de commande.", photo: "/images/echarpe-fiere-parisienne.webp" },
  { slug: "autorisation", code: "Autorisation", title: "Vous n’avez pas les droits nécessaires", text: "Votre compte n’a pas les droits requis pour cette action. Contactez la super administratrice si besoin.", photo: "/images/vestiaire-fauteuils.webp" },
  { slug: "formulaire", code: "Formulaire", title: "Certains champs sont incorrects", text: "Vérifiez les champs signalés en rouge puis validez de nouveau.", photo: "/images/vestiaire-maillots.webp" },
  { slug: "session-expiree", code: "Session", title: "Session expirée", text: "Pour votre sécurité, votre session a expiré. Veuillez vous reconnecter.", photo: "/images/tunnel-ici-cest-paris.webp" },
  { slug: "maintenance", code: "Maintenance", title: "Le service est temporairement en maintenance", text: "Nous améliorons le site. Il sera de nouveau disponible très bientôt.", photo: "/images/parc-des-princes-facade.webp" },
  { slug: "bientot-disponible", code: "Bientôt", title: "Bientôt disponible", text: "Cette page arrive très prochainement. Revenez bientôt !", photo: "/images/parc-des-princes-facade.webp" },
];

export const errorBySlug = (slug: string) => ERROR_PAGES.find((e) => e.slug === slug);
