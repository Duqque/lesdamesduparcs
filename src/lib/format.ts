const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

const shortDateFormatter = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

const monthYearFormatter = new Intl.DateTimeFormat("fr-FR", { year: "numeric", timeZone: "UTC" });

const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

export const formatLongDate = (iso: string) => capitalize(dateFormatter.format(new Date(`${iso}T12:00:00Z`)));
export const formatShortDate = (iso: string) => shortDateFormatter.format(new Date(`${iso}T12:00:00Z`));
const compactDateFormatter = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
export const formatCompactDate = (iso: string) => compactDateFormatter.format(new Date(`${iso}T12:00:00Z`));
export const formatYear = (iso: string) => monthYearFormatter.format(new Date(`${iso}T12:00:00Z`));
export const formatTime = (time: string) => time.replace(":", "h");

export function formatClock(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const s = Math.floor(seconds);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

const dayMonthFormatter = new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });
export const formatDayMonth = (iso: string) => capitalize(dayMonthFormatter.format(new Date(`${iso}T12:00:00Z`)));
