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

## Loader d'entrée

`src/components/intro/IntroLoader.tsx` : compteur **1970 → année en cours** (calculée à l'exécution) avec barre de progression.
Les 61 titres du PSG (championnats, coupes, supercoupes, titres internationaux) s'ajoutent à une liste minimaliste au fil des
années, sur fond de photos en fondu enchaîné, puis une transition dorée mène au site. Les titres viennent de
`src/data/palmares.ts` (source : psg.fr/palmares) : **à mettre à jour à chaque nouveau titre**. Le loader n'est joué qu'une fois par session et ignoré avec `prefers-reduced-motion`.

## Expérience carte membre (`/abonnement`)

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

## Musique de fond

`public/audio/tous-ensemble-on-chantera.mp3` (boucle) démarre dès que le navigateur l'autorise, sinon au premier clic / touche.
Le bouton haut-parleur du header et le lecteur « Le chant du groupe » la contrôlent ; le choix « coupé » est mémorisé.

## Assets provisoires — à remplacer

Les logos (`public/logos/`) sont **provisoires**, découpés depuis la maquette (`scripts/extract-mockup-assets.py`) : remplacer
par le logo officiel des Dames du Parc et les écussons. Les photos de `public/images/` proviennent des visuels fournis ; vérifier
les droits d'utilisation avant mise en ligne. Les liens Spotify et réseaux sociaux sont des valeurs génériques.
