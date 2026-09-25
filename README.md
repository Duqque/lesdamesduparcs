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

## Musique de fond

`public/audio/tous-ensemble-on-chantera.mp3` (boucle) démarre dès que le navigateur l'autorise, sinon au premier clic / touche.
Le bouton haut-parleur du header et le lecteur « Le chant du groupe » la contrôlent ; le choix « coupé » est mémorisé.

## Assets provisoires — à remplacer

Les logos (`public/logos/`) sont **provisoires**, découpés depuis la maquette (`scripts/extract-mockup-assets.py`) : remplacer
par le logo officiel des Dames du Parc et les écussons. Les photos de `public/images/` proviennent des visuels fournis ; vérifier
les droits d'utilisation avant mise en ligne. Les liens Spotify et réseaux sociaux sont des valeurs génériques.
