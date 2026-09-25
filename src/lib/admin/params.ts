/** Utilitaires pour conserver les filtres dans les adresses des pages d'administration. */
export type SP = Record<string, string | string[] | undefined>;

export const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export function pick<K extends string>(sp: SP, keys: readonly K[]): Partial<Record<K, string>> {
  const out: Partial<Record<K, string>> = {};
  for (const k of keys) {
    const v = first(sp[k]);
    if (v) out[k] = v;
  }
  return out;
}

export function href(base: string, params: Record<string, string | number | undefined | null>) {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== null && v !== "") q.set(k, String(v));
  const s = q.toString();
  return s ? `${base}?${s}` : base;
}

/** Adresse de retour interne à l'administration (évite toute redirection vers un autre site). */
export function safeReturn(p: string, fallback = "/admin") {
  return /^\/admin(\/|\?|$)/.test(p) && !p.includes("//") && !p.includes("\\") ? p : fallback;
}
