/**
 * Matchs du PSG : lecture d'un calendrier (fichier ICS ou tableau CSV) et outils d'affichage.
 * Fonctions pures (sans dépendance serveur) : elles servent à l'import, à la synchronisation automatique et aux tests.
 */
export interface ParsedMatch {
  /** Identifiant du calendrier source (UID ICS) : sert à mettre à jour un match déplacé plutôt qu'à le dupliquer */
  uid?: string;
  date: string; // AAAA-MM-JJ, heure de Paris
  time: string; // HH:mm ; vide si l'horaire n'est pas encore connu
  homeTeam: string;
  awayTeam: string;
  competition: string;
  stadium: string;
}

export const PSG_NAME = "Paris Saint-Germain";
export const DEFAULT_TICKET_URL = "https://billetterie.psg.fr/fr/";
export const PARC = "Parc des Princes";

const strip = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
export const isPsg = (team: string) => /\b(psg|paris sg|paris saint germain)\b/.test(strip(team).replace(/-/g, " ")) || strip(team).trim() === "paris";

/** Nom court d'affichage : PSG pour le club, sinon le nom du club adverse. */
export const shortName = (team: string) => (isPsg(team) ? "PSG" : team);
export const opponentOf = (m: Pick<ParsedMatch, "homeTeam" | "awayTeam">) => (isPsg(m.homeTeam) ? m.awayTeam : m.homeTeam);
export const isHome = (m: Pick<ParsedMatch, "homeTeam">) => isPsg(m.homeTeam);
export const matchTitle = (m: Pick<ParsedMatch, "homeTeam" | "awayTeam">) => `${shortName(m.homeTeam)} – ${shortName(m.awayTeam)}`;

const canonical = (team: string) => (isPsg(team) ? PSG_NAME : team.trim());

/** Instant UTC → date et heure locales de Paris. */
export function toParis(d: Date): { date: string; time: string } {
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Paris", hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }).formatToParts(d);
  const g = (t: string) => parts.find((p) => p.type === t)?.value ?? "00";
  return { date: `${g("year")}-${g("month")}-${g("day")}`, time: `${g("hour")}:${g("minute")}` };
}

/** Sépare « A - B », « A – B », « A vs B », « A v B », « A contre B » en deux équipes. */
export function splitTeams(summary: string): { home: string; away: string; competition: string } | null {
  let text = summary.replace(/\s+/g, " ").trim();
  let competition = "";
  const bracket = /^\s*[\[(]([^\])]+)[\])]\s*/.exec(text) ?? /\s*[\[(]([^\])]+)[\])]\s*$/.exec(text);
  if (bracket) {
    competition = bracket[1].trim();
    text = text.replace(bracket[0], " ").trim();
  }
  const colon = /^([^:]{3,40}):\s*(.+)$/.exec(text);
  if (colon && /(ligue|coupe|champions|trophee|trophée|supercoupe|europa|conference)/i.test(colon[1])) {
    competition = competition || colon[1].trim();
    text = colon[2].trim();
  }
  const parts = text.split(/\s+(?:[-–—]|vs\.?|v|contre|@)\s+/i);
  if (parts.length < 2) return null;
  const [home, away] = [parts[0].trim(), parts.slice(1).join(" - ").trim()];
  return home && away ? { home, away, competition } : null;
}

const unfold = (raw: string) => raw.replace(/\r\n?/g, "\n").replace(/\n[ \t]/g, "");
const unescape = (s: string) => s.replace(/\\n/gi, "\n").replace(/\\([,;\\])/g, "$1").trim();

function icsDate(prop: string, value: string): { date: string; time: string } | null {
  const v = value.trim();
  const allDay = /^(\d{4})(\d{2})(\d{2})$/.exec(v);
  if (allDay) return { date: `${allDay[1]}-${allDay[2]}-${allDay[3]}`, time: "" };
  const m = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})?(Z)?$/.exec(v);
  if (!m) return null;
  if (m[7] === "Z") return toParis(new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5])));
  if (/TZID=/i.test(prop) && !/TZID=Europe\/Paris/i.test(prop)) {
    // Autre fuseau : on interprète l'horaire comme UTC en dernier recours (les calendriers du PSG sont en UTC ou Paris).
    return toParis(new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5])));
  }
  return { date: `${m[1]}-${m[2]}-${m[3]}`, time: `${m[4]}:${m[5]}` };
}

export function parseIcs(text: string): ParsedMatch[] {
  const out: ParsedMatch[] = [];
  const blocks = unfold(text).split("BEGIN:VEVENT").slice(1);
  for (const b of blocks) {
    const body = b.split("END:VEVENT")[0];
    const get = (name: string) => {
      const m = new RegExp(`^${name}((?:;[^:\\n]*)?):(.*)$`, "im").exec(body);
      return m ? { prop: m[1], value: m[2] } : null;
    };
    const summary = get("SUMMARY");
    const start = get("DTSTART");
    if (!summary || !start) continue;
    if (/^STATUS:CANCELLED/im.test(body)) continue;
    const when = icsDate(start.prop, start.value);
    const teams = splitTeams(unescape(summary.value));
    if (!when || !teams) continue;
    const location = get("LOCATION") ? unescape(get("LOCATION")!.value) : "";
    const cat = get("CATEGORIES") ? unescape(get("CATEGORIES")!.value) : "";
    const descFirst = (get("DESCRIPTION") ? unescape(get("DESCRIPTION")!.value) : "").split("\n")[0].trim();
    const fromDesc = /(ligue|coupe|champions|troph|supercoupe|europa|conference)/i.test(descFirst) ? descFirst.slice(0, 60) : "";
    const homeTeam = canonical(teams.home);
    const awayTeam = canonical(teams.away);
    if (!isPsg(homeTeam) && !isPsg(awayTeam)) continue; // on ne garde que les matchs du PSG
    out.push({
      uid: get("UID")?.value.trim() || undefined,
      date: when.date,
      time: when.time,
      homeTeam,
      awayTeam,
      competition: teams.competition || cat || fromDesc,
      stadium: location.split(",")[0].trim() || (isPsg(homeTeam) ? PARC : ""),
    });
  }
  return out;
}

const MONTHS_FR: Record<string, number> = { janv: 1, janvier: 1, jan: 1, fev: 2, fevr: 2, fevrier: 2, mars: 3, avr: 4, avril: 4, mai: 5, juin: 6, juil: 7, juillet: 7, aout: 8, sept: 9, septembre: 9, oct: 10, octobre: 10, nov: 11, novembre: 11, dec: 12, decembre: 12 };

const parseDate = (v: string) => {
  const t = v.trim();
  // « 10 oct. 2026 », « 3 janvier 2027 »
  const fr = /^(\d{1,2})(?:er)?\s+([A-Za-zÀ-ÿ]+)\.?\s+(\d{4})/.exec(t);
  if (fr) {
    const mo = MONTHS_FR[strip(fr[2])];
    if (mo) return `${fr[3]}-${String(mo).padStart(2, "0")}-${fr[1].padStart(2, "0")}`;
  }
  let m = /^(\d{4})-(\d{2})-(\d{2})/.exec(t);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  m = /^(\d{1,2})[/.](\d{1,2})[/.](\d{2,4})/.exec(t);
  if (!m) return null;
  const y = m[3].length === 2 ? `20${m[3]}` : m[3];
  return `${y}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
};
const parseTime = (v: string) => {
  const m = /^(\d{1,2})\s*[:hH]\s*(\d{2})?/.exec(v.trim());
  return m ? `${m[1].padStart(2, "0")}:${m[2] ?? "00"}` : "";
};

/** Tableau : date ; heure ; domicile ; extérieur ; compétition ; stade (séparateur ; , ou tabulation, en-tête facultatif). Ou « date heure : équipe A - équipe B (compétition) ». */
export function parseTable(text: string): ParsedMatch[] {
  const out: ParsedMatch[] = [];
  for (const line of text.replace(/\r/g, "").split("\n")) {
    if (!line.trim() || /^(date|jour)\b/i.test(line.trim())) continue;
    const cells = line.split(/;|\t/).length > 1 ? line.split(/;|\t/) : line.split(",").length >= 4 ? line.split(",") : [line];
    if (cells.length >= 4) {
      const date = parseDate(cells[0]);
      if (!date) continue;
      const time = parseTime(cells[1] ?? "");
      // Colonne « Match » combinée (« PSG – Le Mans ») : date, heure, match, compétition[, stade]
      const combined = splitTeams(cells[2]);
      if (combined && !cells[3].includes(" – ") && (isPsg(combined.home) || isPsg(combined.away))) {
        out.push({ date, time, homeTeam: canonical(combined.home), awayTeam: canonical(combined.away), competition: (cells[3] ?? "").trim() || combined.competition, stadium: (cells[4] ?? "").trim() || (isPsg(combined.home) ? PARC : "") });
        continue;
      }
      const home = cells[2].trim();
      const away = cells[3].trim();
      if (!home || !away || (!isPsg(home) && !isPsg(away))) continue;
      out.push({ date, time, homeTeam: canonical(home), awayTeam: canonical(away), competition: (cells[4] ?? "").trim(), stadium: (cells[5] ?? "").trim() || (isPsg(home) ? PARC : "") });
      continue;
    }
    // Ligne libre : « 17/10/2026 21h00 PSG - OM (Ligue 1) »
    const m = /^\s*(\d{1,2}[/.]\d{1,2}[/.]\d{2,4}|\d{4}-\d{2}-\d{2})\s+(?:(\d{1,2}\s*[:hH]\s*\d{0,2})\s+)?(.+)$/.exec(line);
    if (!m) continue;
    const date = parseDate(m[1]);
    const teams = splitTeams(m[3]);
    if (!date || !teams || (!isPsg(teams.home) && !isPsg(teams.away))) continue;
    out.push({ date, time: parseTime(m[2] ?? ""), homeTeam: canonical(teams.home), awayTeam: canonical(teams.away), competition: teams.competition, stadium: isPsg(teams.home) ? PARC : "" });
  }
  return out;
}

/** Détecte le format (ICS ou tableau) et lit les matchs. */
export function parseCalendarText(text: string): ParsedMatch[] {
  return /BEGIN:VCALENDAR|BEGIN:VEVENT/i.test(text) ? parseIcs(text) : parseTable(text);
}

/** Clé de rapprochement quand le calendrier ne fournit pas d'identifiant. */
export const matchKey = (m: Pick<ParsedMatch, "date" | "homeTeam" | "awayTeam">) => `${m.date}|${strip(m.homeTeam)}|${strip(m.awayTeam)}`;

/** Initiales d'un club (pastille de secours quand aucun logo n'est disponible). */
export const initials = (team: string) =>
  team
    .replace(/\b(FC|AC|AS|SC|OGC|RC|Olympique|Stade|Club|de|du|des|la|le|les|d')\b/gi, "")
    .split(/[\s-]+/)
    .filter(Boolean)
    .slice(0, 3)
    .map((w) => w[0].toUpperCase())
    .join("") || team.slice(0, 3).toUpperCase();
