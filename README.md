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

## Assets provisoires — à remplacer

Les photos (`public/images/`), les logos (`public/logos/`) et l'extrait audio (`public/audio/`) sont **provisoires** :
photos et logos sont découpés depuis la maquette (`scripts/extract-mockup-assets.py`), l'audio est synthétisé
(`scripts/generate-placeholder-audio.py`). Remplacer par le logo officiel, de vraies photographies HD et l'enregistrement
du chant en gardant les mêmes noms de fichiers (ou en mettant à jour `src/data/`). Les liens Spotify et réseaux sociaux
sont aussi des valeurs génériques.
