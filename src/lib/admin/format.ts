export const eur = (cents: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: cents % 100 === 0 ? 0 : 2 }).format(cents / 100);

export const num = (n: number) => new Intl.NumberFormat("fr-FR").format(n);

export const fmtDate = (iso?: string | null) => (iso ? new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "2-digit" }) : "");
export const fmtDateLong = (iso?: string | null) => (iso ? new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }) : "");
export const fmtTime = (iso?: string | null) => (iso ? new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) : "");
export const fmtDateTime = (iso?: string | null) => (iso ? `${fmtDate(iso)} ${fmtTime(iso)}` : "");

export const pct = (n: number) => `${n >= 0 ? "+" : ""}${n.toFixed(1).replace(".", ",")} %`;

/** Décalage d'une date ISO en jours. */
export const addDays = (d: Date, n: number) => new Date(d.getTime() + n * 86_400_000);
export const dayKey = (d: Date | string) => new Date(d).toISOString().slice(0, 10);
export const monthKey = (d: Date | string) => new Date(d).toISOString().slice(0, 7);

/** Découpe une période (?range=7d|30d|3m|6m|1y|custom) en dates de début et de fin. */
export function resolveRange(range: string | undefined, from?: string, to?: string) {
  const end = to ? new Date(`${to}T23:59:59Z`) : new Date();
  let start: Date;
  switch (range) {
    case "7d": start = addDays(end, -6); break;
    case "3m": start = addDays(end, -90); break;
    case "6m": start = addDays(end, -180); break;
    case "1y": start = addDays(end, -364); break;
    case "custom": start = from ? new Date(`${from}T00:00:00Z`) : addDays(end, -29); break;
    default: start = addDays(end, -29);
  }
  const days = Math.max(1, Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1);
  return { start, end, days, key: range ?? "30d" };
}

export const RANGES = [
  { key: "7d", label: "7 jours" },
  { key: "30d", label: "30 jours" },
  { key: "3m", label: "3 mois" },
  { key: "6m", label: "6 mois" },
  { key: "1y", label: "1 an" },
] as const;
