import type { NavItem } from "@/types";

export interface NavConfig {
  hidden: string[];
  labels: Record<string, string>;
  /** Boutique fermée (masquée, en maintenance ou « bientôt disponible ») : pas de bouton panier */
  hideCart?: boolean;
}

/** Applique les libellés et masquages du back-office aux liens de navigation. */
export function applyNav(items: readonly NavItem[], cfg: NavConfig): NavItem[] {
  return items
    .filter((i) => !cfg.hidden.includes(i.href))
    .map((i) => ({ ...i, label: cfg.labels[i.href] || i.label, children: i.children?.map((c) => ({ ...c, label: cfg.labels[c.href] || c.label })) }));
}
