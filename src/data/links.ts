export interface DiscreetLink {
  id: "join" | "spotify" | "psg" | "shop";
  kicker: string;
  label: string;
  href: string;
  external?: boolean;
}

export const spotifyPlaylistUrl = "https://open.spotify.com/playlist/2GCThg2UwVkIUSBJhx8CnD";
export const psgOfficialUrl = "https://www.psg.fr";

export const discreetLinks: DiscreetLink[] = [
  { id: "join", kicker: "Adhésion", label: "Rejoindre le groupe", href: "/rejoindre-le-groupe" },
  { id: "spotify", kicker: "Playlist", label: "Écouter nos chants", href: spotifyPlaylistUrl, external: true },
  { id: "psg", kicker: "Le club", label: "Site officiel du PSG", href: psgOfficialUrl, external: true },
  { id: "shop", kicker: "Boutique", label: "Afficher son soutien", href: "/boutique" },
];
