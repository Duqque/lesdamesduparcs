import type { EventRegistrationConfig } from "@/types";
import { parisDateTime } from "@/lib/seo";

/** Instant d'ouverture programmée de la billetterie (heure de Paris), ou null. */
export function salesOpensAtMs(cfg: Pick<EventRegistrationConfig, "salesState" | "salesOpensAt">) {
  if (cfg.salesState !== "scheduled" || !cfg.salesOpensAt || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(cfg.salesOpensAt)) return null;
  const [date, time] = cfg.salesOpensAt.split("T");
  return new Date(parisDateTime(date, time)).getTime();
}

/** La billetterie de l'événement accepte-t-elle des réservations maintenant ? */
export function salesOpen(cfg: Pick<EventRegistrationConfig, "mode" | "salesState" | "salesOpensAt">, now = Date.now()) {
  if (cfg.mode !== "form") return false;
  if (!cfg.salesState || cfg.salesState === "open") return true;
  if (cfg.salesState === "paused") return false;
  const at = salesOpensAtMs(cfg);
  return at !== null && now >= at;
}

/** Message affiché tant que la billetterie n'est pas ouverte. */
export function salesNotice(cfg: Pick<EventRegistrationConfig, "salesState" | "salesOpensAt">) {
  const at = salesOpensAtMs(cfg);
  if (at) {
    const d = new Date(at);
    const day = d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", timeZone: "Europe/Paris" });
    const time = d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" }).replace(":", "h");
    return { short: `Billetterie le ${d.toLocaleDateString("fr-FR", { day: "numeric", month: "short", timeZone: "Europe/Paris" })}`, long: `La billetterie ouvrira le ${day} à ${time}.` };
  }
  return { short: "Billetterie bientôt ouverte", long: "La billetterie n'est pas encore ouverte : la date d'ouverture et le nombre de places seront annoncés prochainement." };
}
