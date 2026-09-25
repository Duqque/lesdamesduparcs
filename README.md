# Les Dames du Parc

Site officiel des **Dames du Parc**, groupe de supportrices 100 % féminin du Paris Saint-Germain.
Cette première version livre la **homepage immersive** ; les autres routes sont des placeholders propres.

## Stack

- [Next.js](https://nextjs.org) (App Router) + React 19 + TypeScript
- Tailwind CSS v4 (tokens dans `src/app/globals.css`)
- Framer Motion (animations, `prefers-reduced-motion` respecté) + Lucide Icons
- Polices via `next/font` : Barlow Condensed (titres), Inter (texte), Caveat (manuscrit)

## Installation

```bash
npm install
```

## Développement

```bash
npm run dev
```

## Production

```bash
npm run build
npm run start
```

Aucune variable d'environnement n'est requise pour l'instant. Copier `.env.example` vers `.env.local` au besoin.

## Structure

```text
src/
├── app/            routes (/, /groupe, /evenements, /billetterie, /communaute, /boutique, /actualites, /profil)
├── components/     layout, navigation, hero, member, matches, events, community, news, chants, shop, footer, ui, icons
├── data/           contenus locaux typés (matches, events, news, products, chants, members) — remplaçables par CMS/API
├── types/          modèles (Match, ClubEvent, NewsItem, Chant, User…)
├── hooks/  lib/    utilitaires
public/             images, logos, audio
scripts/            génération des assets provisoires
```

Les composants reçoivent des données structurées (`<MatchCard match={nextMatch} />`) : brancher un backend revient à remplacer
le contenu de `src/data/`. Le type `User` (profil, adhésion, billets, événements, avantages, équipe, notifications, achats)
prépare l'espace membre.

## Typographie

Une seule famille (Barlow) sur tout le site : seules la taille, la graisse et la casse varient. L'échelle est définie dans
`globals.css` (`t-display`, `t-h1`, `t-h2`, `t-h3`, `t-eyebrow`, `t-lead`, `t-small`, `t-caption`) : à utiliser plutôt que des tailles ad hoc.

## Loader d'entrée : « entrer dans le Parc »

`src/components/intro/IntroLoader.tsx` + `parcScene.ts` (Three.js, chargé à la demande) : scène WebGL plein écran, sans barre de progression,
seulement un pourcentage discret. Une progression unique (0 → 100 %, ~8 s + palier de 1,4 s) pilote :

- le **Parc des Princes de nuit** (photo en 3 couches avec parallaxe : toit, tribunes, pelouse) qui sort de l'obscurité, puis les
  **projecteurs** qui s'allument section par section (du centre vers les bords), faisceaux, brume et bandeau « Ici c'est Paris » ;
- un **travelling arrière** lent avec légère montée ;
- la **médaille 3D** du logo (relief, tissage carbone, métal rouge, vernis, reflets d'environnement, éclairage de contour) qui se révèle avec
  les projecteurs, tourne de quelques degrés et flotte, avec deux balayages de lumière (allumage puis fin de chargement).

Textures générées par `scripts/build-loader-assets.py` (sources dans `scripts/source/`, sorties dans `public/loader/`).
Joué une fois par session ; ignoré avec `prefers-reduced-motion` ou sans WebGL ; bouton « Passer ». Aperçu figé d'une étape : `/?introDebug=0.7`
(vider `sessionStorage` avant).

## Expérience carte membre (`/rejoindre-le-groupe`)

La carte est le fil conducteur de la page : un conteneur haut avec une scène `sticky` plein écran, dont toute la chorégraphie est
pilotée par la progression du scroll (`useScroll` + `useSpring` de framer-motion, sans GSAP).

**Règles de mise en page :** la carte est **fixe au centre** (elle ne se translate ni ne change d'échelle : seules ses rotations
évoluent), sa largeur est plafonnée à **28 % de la largeur** sur bureau/tablette (`--cw` dans `globals.css`), et **rien ne la
recouvre** : chaque scène vit dans une zone dédiée (`.zone-top`, `.zone-bottom`, `.zone-left`, `.zone-right`) calculée à partir de
la taille de la carte. L'orbite des avantages est dimensionnée pour ne jamais croiser la carte. Sur mobile la carte passe à 58 %
de la largeur (une carte à 30 % serait illisible) et les scènes se recomposent au-dessus / au-dessous.

`pose.ts` définit les rotations par étape ; `Scenes.tsx` contient les 9 scènes : carte, identité imprimée, retournement, avantages
en orbite, agenda, newsletter au verso, carte virtuelle avec QR code et bouton Apple Wallet, foule de cartes, prix (12 € / saison).
La souris ajoute une inclinaison discrète (±4° / ±3°) ; `prefers-reduced-motion` coupe la dérive, la souris et l'entrée.

`CardObject.tsx` est la carte en CSS 3D (recto/verso, épaisseur en calques, `translateZ` par élément, reflets, grain).
Les logos (`public/logos/card-logo-*.webp`) sont découpés des rendus de référence (`scripts/extract-card-assets.py`).
Le contenu (avantages, agenda, newsletters, prix) est dans `src/data/membership.ts` — **exemples illustratifs à remplacer**.

**Apple Wallet :** le bouton simule la génération ; le vrai fichier `.pkpass` demande un certificat Apple Developer et une
route serveur de signature, non implémentés.

## Page « Le groupe » (`/groupe`)

Présentation rédigée de l'association (textes dans `src/app/groupe/page.tsx` et `src/data/group.ts`, sans tirets longs) autour d'un
médaillon 3D du logo officiel (`src/components/group/Logo3D.tsx`) : épaisseur en calques, inclinaison à la souris avec inertie,
dérive lente, rotation liée au scroll, reflet spéculaire, clic pour le faire tourner. Le logo officiel est dans
`public/logos/dames-du-parc-logo.webp` (aussi utilisé sur la carte membre).

## Calendrier et événements (`/evenements`)

Calendrier « affiche de programme » (`ScheduleBoard.tsx`, `ScheduleTile.tsx`) : panneau verre sur photo floutée, grand titre condensé,
tuiles-affiches à défilement horizontal (souris, doigt, flèches), codées par couleur (rouge : match, marine : déplacement, ivoire :
vie du groupe) et filtrables via la légende. Chaque tuile mène à `/evenements/[slug]` (description, déroulé, intervenants, infos
pratiques, inscription). Un bouton « Réserver ma place » reste fixé en bas de l'écran (`ReserveBar.tsx`). Export agenda :
`/evenements/calendrier.ics` et `/evenements/[slug]/event.ics` (`src/lib/ics.ts`).

Les événements (`src/data/events.ts`) sont **fictifs** (dates, tarifs, places). Seuls Priscilla Gneto (judo, PSG Judo) et le cadre du
programme « Allez les filles » (filles de 11 à 16 ans, PSG For Communities) viennent de l'article du PSG.

## Connexion, inscriptions et paiement

Le visiteur n'est **jamais connecté d'office** : la session est un cookie signé (HMAC) lu côté serveur (`src/lib/server/session.ts`).
Deux espaces, sur `/connexion` et sur chaque page d'événement : **Membre** (e-mail ou numéro de membre + mot de passe) et
**Administrateur** (e-mail + mot de passe, variables `DEMO_ADMIN_*` : socle de démonstration à remplacer par de vrais comptes).

## Devenir membre (`/rejoindre-le-groupe/inscription`)

Parcours entièrement automatique :

1. **Formulaire** en 2 ou 3 étapes (`InscriptionClient.tsx`, validation partagée dans `src/lib/members.ts`) : identité, coordonnées,
   mot de passe (haché avec scrypt). Si la date de naissance indique une personne **mineure** (< 18 ans), une étape supplémentaire
   exige les coordonnées du responsable légal et **1 à 3 PDF d'autorisation parentale** (5 Mo max, type vérifié sur le contenu).
   Un modèle à signer est généré sur `/api/autorisation-parentale`.
2. **Création du compte** (`POST /api/members`) : numéro de membre, jeton de vérification secret, session ouverte.
   Le **numéro de membre** suit le format `3 lettres du nom + 3 lettres du prénom + JJMMAA + -LDDP + année`
   (ex. `DUQQUE120399-LDDP2026` ; lettre de départage B, C… en cas d'homonymie).
3. **Carte membre** (`/profil`, `MemberCard.tsx`) : générée avec les informations de la membre et un **QR code** qui pointe vers
   `/verification/[jeton]`.
4. **Preuve d'adhésion** (`/verification/[jeton]`) : page publique minimale (nom, numéro, saison, validité) ; les administrateurs
   connectés voient le dossier complet (contact, responsable légal, PDF d'autorisation).
5. **Attestation PDF** (`/api/attestation/[jeton]`, `src/lib/server/pdf.ts`, pdf-lib) sur le modèle d'une attestation de licence :
   logo, couleurs du PSG, mini-carte, QR code, bandeau carte. Accessible à la titulaire connectée et aux administrateurs.
6. **Espace membre** (`/profil`) : carte, attestation, transactions (commandes boutique et inscriptions aux événements
   rattachées au numéro de membre), avantages, informations. L'administrateur y trouve la liste des adhérentes.

Les informations de l'association (SIRET, RNA, adresse, présidente) sont **fictives** : `src/data/association.ts`.
Les membres et les PDF déposés sont stockés dans `.data/` (ignoré par Git). Définir `NEXT_PUBLIC_SITE_URL` pour que les QR codes
pointent vers le domaine public. Le paiement de la cotisation n'est pas encore branché sur ce parcours.

- **Inscription** (`RegistrationForm.tsx`) : réservée aux membres connectées ; contrôlée côté serveur (`/api/events/[slug]/register`,
  validation partagée dans `src/lib/registration.ts`, âge et responsable légal pour les mineures, capacité, doublons).
- **Administrateur** (`AdminRegistrations.tsx`) : inscriptions, places prises, encaissé, export CSV.
- **Stockage** : fichier local `.data/registrations.json` (ignoré par Git), à remplacer par une base de données en production.
- **Paiement** : Stripe Checkout (page hébergée par Stripe, aucun numéro de carte n'est saisi sur le site). Renseigner
  `STRIPE_SECRET_KEY` et `NEXT_PUBLIC_SITE_URL`. Le retour est vérifié auprès de Stripe avant de marquer l'inscription « payée ».
  Sans clé, l'inscription est enregistrée « en attente de paiement ».
- À prévoir avant la mise en production : HTTPS, limitation de débit partagée (celle fournie est en mémoire), e-mails de
  confirmation, webhooks Stripe, mentions RGPD.

## Back-office (`/admin`)

Plateforme métier connectée aux données du site (adhérentes, adhésions, paiements, événements, inscriptions, contenu). Connexion séparée
de l'espace membre : `/admin/connexion`.

- **Comptes et sécurité** : mot de passe haché (scrypt), sessions côté serveur avec expiration par inactivité (30 min par défaut),
  blocage après 5 tentatives, double authentification TOTP (facultative ou imposée à la super administratrice), déconnexion de toutes les
  sessions, journal des connexions (adresse IP, connexions depuis une nouvelle adresse signalées), réinitialisation du mot de passe par lien
  généré par la super administratrice. La super administratrice de départ est créée depuis `SUPERADMIN_EMAIL` / `SUPERADMIN_PASSWORD` / `SUPERADMIN_NAME`.
- **Rôles** (`src/lib/admin/permissions.ts`) : super administratrice, administratrice, trésorière, communication, bénévole événementiel.
  Chaque page, chaque action et chaque export vérifient la permission. **La structure et le design du site (sections de l'accueil,
  navigation, SEO, couleur d'accent, pied de page) ne sont modifiables que par la super administratrice.**
- **Adhérentes** : liste filtrable (nom, formule, statut, paiement, ville, âge, dates…), fiche complète (adhésions, paiements, événements,
  présences), création, renouvellement, suspension, anonymisation, envoi d'e-mail, import CSV, export de ses données, formules d'adhésion.
- **Événements** : création en sept étapes (avec répétition), publication planifiée, inscriptions, liste d'attente automatique (une place
  libérée est proposée à la première personne), présences avec pointage par numéro ou QR code (caméra), calendrier global.
- **Finances** : transactions unifiées (adhésions, événements, boutique), recettes, paiements en attente ou échoués, marquage payé,
  annulation, remboursement (suivi comptable : le remboursement effectif se fait chez le prestataire), relances.
- **Événements payants** : tarif de base, tarifs selon la formule d'adhésion (reconnue automatiquement), codes promotionnels, quatre modes de
  paiement (en ligne obligatoire, en ligne facultatif, sur place, manuel avec consignes), liste d'attente, paiement Stripe, remboursement réel chez
  Stripe depuis le back-office. Les tarifs ne sont modifiables qu'avec la permission `events.pricing` (super, administratrice, trésorière).
- **Boutique** : produits, photos, tailles, prix, stocks (réservés à la commande, remis en vente en cas d'annulation ou d'expiration), commandes avec
  suivi de préparation et d'expédition (numéro de suivi, e-mail à la cliente), livraison et seuil de gratuité, codes promotionnels appliqués au paiement.
  Permissions séparées : `shop.edit` (fiches, photos), `shop.pricing` (prix, livraison), `shop.stock`, `shop.orders`.
- **Contenu et site** : articles (brouillon, programmé, publié), catégories, tags, médiathèque (contrôle du contenu réel des fichiers),
  textes et éléments mis en avant de l'accueil, partenaires, offres, codes promotionnels.
- **Communication** : campagnes par segments, modèles, automatisations (bienvenue, confirmation, rappels J-30/J-7, rappels d'événement…).
  L'envoi passe par Resend (`RESEND_API_KEY`) ; sans clé, les messages sont consignés « non envoyés ». Les rappels planifiés sont traités
  toutes les 10 minutes quand l'administration est ouverte, ou par un appel à `POST /api/cron/tick` avec `Authorization: Bearer $CRON_SECRET`.
- **Analytics et rapports** : membres, finances, événements, mesure d'audience interne sans cookie ni adresse IP, rapports mensuels en PDF.
- **Exports** CSV (« Excel » : CSV avec point-virgule qui s'ouvre dans Excel) et PDF, qui respectent les filtres. Journal d'activité avec ancien et nouveau contenu.
- **Recherche globale** (⌘ K / Ctrl+K) et notifications, limitées aux données que le rôle peut voir.

Stockage : fichiers JSON dans `.data/` (`src/lib/server/db.ts` isole l'accès : passer à une base SQL ne touchera que ce fichier).
À faire avant l'ouverture au public : base de données, sauvegardes de `.data/`, service d'e-mail, webhook Stripe (le paiement est aujourd'hui
confirmé au retour sur le site), édition complète du contenu des pages du site.

## Accueil

Une seule colonne de rubriques qui apparaissent au fil du scroll : hero, manifeste (grand texte écrit lettre par lettre au scroll,
petite écharpe 3D), rendez-vous, citation et playlist, chant du groupe, actualités, galerie (deux rangées). L'espace membre n'est
plus affiché sur la page : il s'ouvre uniquement depuis l'icône de profil du header (`AccountMenu.tsx`).

## Boutique et commande

`/boutique` (vitrine à diaporama numéroté, nouveautés, catalogue filtrable), `/boutique/[slug]` (fiche produit, taille, quantité,
**achat rapide** sans compte), panier persistant (`src/lib/cart.ts`, localStorage) avec tiroir latéral, `/panier`, `/commande`
(invité ou membre connectée, préremplie) et `/commande/confirmation`. Le catalogue est dans `src/data/shop.ts` (fictif, photos
provisoires). Le serveur (`/api/shop/checkout`) **recalcule toujours les prix** depuis le catalogue, enregistre la commande
(`.data/orders.json`, ignoré par Git) et crée une session Stripe Checkout ; le retour est vérifié auprès de Stripe avant de marquer
« payée ». Sans `STRIPE_SECRET_KEY`, la commande reste « en attente de paiement ».

## Musique de fond

`public/audio/tous-ensemble-on-chantera.mp3` (boucle) démarre dès que le navigateur l'autorise, sinon au premier clic / touche.
Le bouton haut-parleur du header et le lecteur « Le chant du groupe » la contrôlent ; le choix « coupé » est mémorisé.

## Assets provisoires — à remplacer

Les logos (`public/logos/`) sont **provisoires**, découpés depuis la maquette (`scripts/extract-mockup-assets.py`) : remplacer
par le logo officiel des Dames du Parc et les écussons. Les photos de `public/images/` proviennent des visuels fournis ; vérifier
les droits d'utilisation avant mise en ligne. Les liens Spotify et réseaux sociaux sont des valeurs génériques.
