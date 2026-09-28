import communesData from "@/data/communes-fr.json";
import { throttled } from "@/lib/server/http";

/**
 * Autocomplétion des communes de France (métropole, outre-mer : 34 969 communes, 35 493 couples ville / code postal).
 * Données ouvertes de l'API Géo (geo.api.gouv.fr), embarquées : aucune requête vers un service externe, aucune donnée du visiteur transmise.
 *   ?q=750        → codes postaux commençant par 750
 *   ?q=saint den  → communes dont le nom commence par « saint den » (puis contenant ces mots)
 */
type Entry = [string, string, string]; // nom, code postal, département
const ENTRIES = communesData as Entry[];

const norm = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/œ/g, "oe")
    .replace(/æ/g, "ae")
    .replace(/['’\-]/g, " ")
    .replace(/\bst\b/g, "saint")
    .replace(/\bste\b/g, "sainte")
    .replace(/\s+/g, " ")
    .trim();

let index: string[] | null = null;
const names = () => (index ??= ENTRIES.map((e) => norm(e[0])));
let byPostal: Entry[] | null = null;
const postalSorted = () => (byPostal ??= ENTRIES.slice().sort((a, b) => a[1].localeCompare(b[1]) || a[0].localeCompare(b[0])));

/** Paris, Lyon et Marseille : chaque code postal est un arrondissement (« Paris 1er », « Lyon 3e », « Marseille 8e »). */
const arrondissement = (city: string, postal: string) => {
  const n = city === "Paris" ? (postal.startsWith("750") ? Number(postal.slice(3)) : 0) : city === "Lyon" ? (postal.startsWith("690") ? Number(postal.slice(3)) : 0) : city === "Marseille" ? (postal.startsWith("130") ? Number(postal.slice(3)) : 0) : 0;
  return n > 0 ? `${city} ${n === 1 ? "1er" : `${n}e`}` : undefined;
};
const out = (e: Entry) => ({ city: e[0], postalCode: e[1], department: e[2], label: arrondissement(e[0], e[1]) });

export async function GET(req: Request) {
  if (await throttled(req, "geo", 240, 60_000)) return new Response("[]", { status: 429, headers: { "Content-Type": "application/json" } });
  const raw = (new URL(req.url).searchParams.get("q") ?? "").slice(0, 60);
  const headers = { "Content-Type": "application/json", "Cache-Control": "public, max-age=86400" };
  // Pas de plafond serré : tous les arrondissements de Paris, Lyon et Marseille et toutes les communes de même nom doivent apparaître.
  const limit = 80;
  const q = norm(raw);
  if (q.length < 2) return new Response("[]", { headers });

  if (/^\d+$/.test(q)) {
    const res: Entry[] = [];
    for (const e of postalSorted()) {
      if (e[1].startsWith(q)) res.push(e);
      if (res.length >= limit) break;
    }
    return Response.json(res.map(out), { headers });
  }

  const idx = names();
  const starts: number[] = [];
  const words: number[] = [];
  for (let i = 0; i < ENTRIES.length; i++) {
    const n = idx[i];
    if (n.startsWith(q)) starts.push(i);
    else if (n.includes(` ${q}`)) words.push(i);
  }
  const rank = (a: number, b: number) => idx[a].length - idx[b].length || ENTRIES[a][1].localeCompare(ENTRIES[b][1]);
  const picked = [...starts.sort(rank), ...words.sort(rank)].slice(0, limit);
  return Response.json(picked.map((i) => out(ENTRIES[i])), { headers });
}
