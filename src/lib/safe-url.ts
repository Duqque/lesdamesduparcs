/** Adresse sûre : lien http(s) absolu ou chemin interne. Refuse javascript:, data:, //hôte, etc. (défense XSS sur les liens saisis en administration). */
export function safeUrl(value: string | null | undefined): string {
  const v = (value ?? "").trim().slice(0, 500);
  if (!v) return "";
  if (/^https?:\/\/[^\s<>"']+$/i.test(v)) return v;
  if (v.startsWith("/") && !v.startsWith("//") && !/[\s<>"'\\]/.test(v)) return v;
  return "";
}
