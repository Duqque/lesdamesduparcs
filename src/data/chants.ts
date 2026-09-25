import type { Chant, Playlist } from "@/types";

export const featuredChant: Chant = {
  id: "allez-paris",
  title: "Allez Paris",
  artist: "Les Dames du Parc",
  audioSrc: "/audio/allez-paris-preview.wav",
  duration: 14,
  spotifyUrl: "https://open.spotify.com/",
  waveform: [
    1, 0.37, 0.58, 0.28, 0.98, 0.88, 0.15, 0.5, 0.06, 1, 0.72, 0.37, 0.56, 0.28, 0.98, 0.59, 0.1, 0.49, 0.06, 1, 0.51,
    0.29, 0.57, 0.28, 0.98, 0.4, 0.48, 0.33, 0.06, 1, 0.37, 0.56, 0.4, 0.28, 0.98, 0.28, 0.49, 0.09, 0.06, 1, 0.37,
    0.59, 0.28, 0.25, 0.98, 0.2, 0.51, 0.04, 0.82, 1, 0.37, 0.57, 0.28, 0.98, 0.88, 0.14, 0.5, 0.06, 0.05, 0.05, 0.05,
    0.05, 0.05, 0.05,
  ],
};

export const playlist: Playlist = {
  title: "Les chansons du Parc",
  tagline: "Nos chants. Notre voix. Notre force.",
  href: "https://open.spotify.com/",
};

export const quote = {
  text: "On ne choisit pas le PSG, le PSG nous choisit.",
  image: "/images/citation-tribune-parc.webp",
};
