import type { Chant, Playlist } from "@/types";

export const featuredChant: Chant = {
  id: "tous-ensemble-on-chantera",
  title: "Tous ensemble on chantera",
  artist: "Les supporters · Salzbourg",
  audioSrc: "/audio/tous-ensemble-on-chantera.mp3",
  duration: 33,
  spotifyUrl: "https://open.spotify.com/playlist/2GCThg2UwVkIUSBJhx8CnD",
  waveform: [0.57, 0.51, 0.54, 0.53, 0.79, 0.81, 0.66, 0.79, 0.39, 0.83, 0.81, 0.86, 0.81, 0.76, 0.65, 0.94, 0.96, 0.81, 0.87, 0.8, 0.71, 0.69, 0.9, 0.73, 0.84, 0.68, 0.74, 0.64, 0.8, 0.79, 0.89, 1.0, 0.78, 0.8, 0.61, 0.89, 0.78, 0.77, 0.75, 0.71, 0.69, 0.94, 0.83, 0.69, 0.59, 0.41, 0.27, 0.2, 0.4, 0.54, 0.49, 0.39, 0.35, 0.23, 0.18, 0.31, 0.39, 0.39, 0.32, 0.3, 0.37, 0.23, 0.27, 0.27],
};

export const playlist: Playlist = {
  title: "Les chansons du Parc",
  tagline: "Nos chants. Notre voix. Notre force.",
  href: "https://open.spotify.com/playlist/2GCThg2UwVkIUSBJhx8CnD",
};

export const quote = {
  text: "On ne choisit pas le PSG, le PSG nous choisit.",
  image: "/images/drapeau-fumee-verte.webp",
};
