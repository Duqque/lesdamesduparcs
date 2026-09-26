import "server-only";
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { collection, singleton, type Row } from "./db";
import { PSG_CALENDAR_SEED } from "@/data/psg-calendar";
import { DEFAULT_TICKET_URL, PARC, isPsg, matchKey, opponentOf, parseCalendarText, type ParsedMatch } from "@/lib/matches";
import type { Match } from "@/types";
import { nextMatch as fallbackMatch } from "@/data/matches";

export interface PsgMatchRow extends Row, ParsedMatch {
  source: "calendrier" | "manuel";
  /** Adresse de billetterie propre à ce match (sinon l'adresse générale) */
  ticketUrl?: string;
  /** Logos carrés (adresses d'images) propres à ce match ; à défaut, ceux enregistrés pour le club ou la compétition */
  homeLogo?: string;
  awayLogo?: string;
  competitionLogo?: string;
  /** Événement des Dames du Parc relié à ce match (co-organisation : « Vivre le match avec les Dames ») */
  relatedEventId?: string;
  hidden?: boolean;
}

export const psgMatches = collection<PsgMatchRow>("psg_matches", () =>
  PSG_CALENDAR_SEED.map(([date, time, homeTeam, awayTeam, competition]) => ({
    id: `match-${date}-${(isPsg(homeTeam) ? awayTeam : homeTeam).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`,
    date,
    time,
    homeTeam,
    awayTeam,
    competition,
    stadium: isPsg(homeTeam) ? PARC : "",
    source: "calendrier" as const,
  })),
);

export const matchSettings = singleton("match_settings", {
  ticketUrl: DEFAULT_TICKET_URL,
  /** Adresse d'un calendrier (ICS) relue automatiquement */
  icsUrl: "",
  lastSync: "",
  lastResult: "",
});

/** Bibliothèque de logos : un logo enregistré pour un club ou une compétition sert pour tous ses matchs. */
export const matchLogos = singleton("match_logos", { teams: {} as Record<string, string>, competitions: {} as Record<string, string> });
export const logoKey = (name: string) => name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const todayParis = () => new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Paris" }).format(new Date());
const cmp = (a: ParsedMatch, b: ParsedMatch) => `${a.date} ${a.time || "99:99"}`.localeCompare(`${b.date} ${b.time || "99:99"}`);

/** Adresse publique https uniquement (pas d'adresse locale ni privée) : protège le serveur contre les requêtes vers son réseau interne. */
async function assertPublicHttps(raw: string) {
  const u = new URL(raw);
  if (u.protocol !== "https:") throw new Error("L'adresse du calendrier doit commencer par https://.");
  if (u.username || u.password) throw new Error("Adresse invalide.");
  const host = u.hostname.replace(/^\[|\]$/g, "");
  const addrs = isIP(host) ? [{ address: host }] : await lookup(host, { all: true });
  for (const { address } of addrs) {
    if (/^(10\.|127\.|0\.|169\.254\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|::1$|fe80:|fc|fd)/i.test(address)) throw new Error("Adresse non autorisée.");
  }
  return u;
}

export interface ImportResult {
  added: number;
  updated: number;
  removed: number;
  total: number;
}

/** Fusionne les matchs lus dans un calendrier : met à jour ceux déjà connus (même identifiant ou même rencontre), ajoute les nouveaux. */
export async function importMatches(parsed: ParsedMatch[], source: "calendrier" | "manuel", opts?: { prune?: boolean }): Promise<ImportResult> {
  const existing = await psgMatches.all();
  const byUid = new Map(existing.filter((m) => m.uid).map((m) => [m.uid!, m]));
  const byKey = new Map(existing.map((m) => [matchKey(m), m]));
  const seen = new Set<string>();
  const res: ImportResult = { added: 0, updated: 0, removed: 0, total: parsed.length };
  for (const p of parsed) {
    const found = (p.uid && byUid.get(p.uid)) || byKey.get(matchKey(p));
    if (found) {
      seen.add(found.id);
      const changed = found.date !== p.date || found.time !== p.time || found.competition !== (p.competition || found.competition) || found.stadium !== (p.stadium || found.stadium);
      if (changed) {
        await psgMatches.update(found.id, { date: p.date, time: p.time, competition: p.competition || found.competition, stadium: p.stadium || found.stadium, homeTeam: p.homeTeam, awayTeam: p.awayTeam, uid: p.uid ?? found.uid });
        res.updated++;
      }
    } else {
      const row = await psgMatches.insert({ ...p, source });
      seen.add(row.id);
      res.added++;
    }
  }
  if (opts?.prune) {
    // Matchs à venir venus d'un calendrier et disparus de celui-ci (annulés) : retirés, sauf s'ils sont reliés à un événement.
    const today = todayParis();
    for (const m of existing) {
      if (m.source === "calendrier" && m.date >= today && !seen.has(m.id) && !m.relatedEventId) {
        await psgMatches.remove(m.id);
        res.removed++;
      }
    }
  }
  return res;
}

/** Relit le calendrier à l'adresse enregistrée et met à jour les matchs. */
export async function syncFromUrl(url?: string): Promise<{ ok: true; result: ImportResult } | { ok: false; error: string }> {
  const settings = await matchSettings.get();
  const target = (url ?? settings.icsUrl).trim();
  if (!target) return { ok: false, error: "Aucune adresse de calendrier enregistrée." };
  try {
    const u = await assertPublicHttps(target);
    const res = await fetch(u, { headers: { Accept: "text/calendar, text/plain, */*" }, cache: "no-store", signal: AbortSignal.timeout(20_000), redirect: "error" });
    if (!res.ok) throw new Error(`Le calendrier répond avec l'erreur ${res.status}.`);
    const text = (await res.text()).slice(0, 5_000_000);
    const parsed = parseCalendarText(text);
    if (!parsed.length) throw new Error("Aucun match du PSG trouvé dans ce calendrier.");
    const result = await importMatches(parsed, "calendrier", { prune: true });
    await matchSettings.set({ lastSync: new Date().toISOString(), lastResult: `${result.total} match(s) lu(s) : ${result.added} ajouté(s), ${result.updated} mis à jour, ${result.removed} retiré(s).` });
    return { ok: true, result };
  } catch (e) {
    const error = e instanceof Error ? e.message : "Synchronisation impossible.";
    await matchSettings.set({ lastSync: new Date().toISOString(), lastResult: `Échec : ${error}` });
    return { ok: false, error };
  }
}

let syncing = false;
/** Actualisation automatique : si un calendrier est configuré, il est relu au plus toutes les 6 heures, en arrière-plan. */
export async function ensureFreshMatches() {
  if (syncing) return;
  const s = await matchSettings.get();
  if (!s.icsUrl || (s.lastSync && Date.now() - new Date(s.lastSync).getTime() < 6 * 3600_000)) return;
  syncing = true;
  void syncFromUrl().finally(() => {
    syncing = false;
  });
}

/** Matchs à venir visibles (les premiers d'abord). */
export async function getUpcomingMatches(limit = 12): Promise<PsgMatchRow[]> {
  void ensureFreshMatches().catch(() => undefined);
  const today = todayParis();
  return (await psgMatches.find((m) => !m.hidden && m.date >= today)).sort(cmp).slice(0, limit);
}

/** Rendu d'un match pour les cartes : trois logos carrés (domicile, extérieur, compétition), billetterie et événement relié. */
export interface MatchView extends Match {
  opponent: string;
  isHome: boolean;
  related: { id: string; title: string } | null;
}

const KNOWN_LOGOS: Record<string, string> = { "olympique-de-marseille": "/logos/team-om.webp", marseille: "/logos/team-om.webp" };
export const PSG_LOGO = "/logos/team-psg.webp";

export async function toView(row: PsgMatchRow, settings?: Awaited<ReturnType<typeof matchSettings.get>>, relatedTitle?: (id: string) => string | undefined, library?: Awaited<ReturnType<typeof matchLogos.get>>): Promise<MatchView> {
  const s = settings ?? (await matchSettings.get());
  const lib = library ?? (await matchLogos.get());
  const teamLogo = (team: string, own?: string) => own || (isPsg(team) ? PSG_LOGO : lib.teams[logoKey(team)] || KNOWN_LOGOS[logoKey(team)] || "");
  const title = row.relatedEventId ? relatedTitle?.(row.relatedEventId) : undefined;
  return {
    id: row.id,
    homeTeam: row.homeTeam,
    awayTeam: row.awayTeam,
    homeLogo: teamLogo(row.homeTeam, row.homeLogo),
    awayLogo: teamLogo(row.awayTeam, row.awayLogo),
    competitionLogo: row.competitionLogo || (row.competition ? lib.competitions[logoKey(row.competition)] : "") || null,
    date: row.date,
    time: row.time,
    stadium: row.stadium || (isPsg(row.homeTeam) ? "Parc des Princes" : ""),
    competition: row.competition,
    image: "/images/parc-pelouse-tribunes.webp",
    ticketHref: row.ticketUrl || s.ticketUrl || DEFAULT_TICKET_URL,
    opponent: opponentOf(row),
    isHome: isPsg(row.homeTeam),
    related: row.relatedEventId && title ? { id: row.relatedEventId, title } : null,
  };
}

/** Vues des prochains matchs (avec l'événement relié s'il est publié). Sans calendrier importé : le match d'exemple d'origine. */
export async function getUpcomingMatchViews(limit = 12): Promise<MatchView[]> {
  const { getPublishedEvents } = await import("./events");
  const [rows, s, events, lib] = await Promise.all([getUpcomingMatches(limit), matchSettings.get(), getPublishedEvents(), matchLogos.get()]);
  const titles = new Map(events.map((e) => [e.id, e.title]));
  if (!rows.length) {
    return [{ ...fallbackMatch, ticketHref: s.ticketUrl || DEFAULT_TICKET_URL, opponent: fallbackMatch.awayTeam, isHome: true, related: null }];
  }
  return Promise.all(rows.map((r) => toView(r, s, (id) => titles.get(id), lib)));
}
