/**
 * Code-barres Code 128 (norme ISO/IEC 15417), lu par tous les lecteurs de billetterie. Jeu C pour une suite de chiffres de longueur
 * paire (plus compact), jeu B sinon. Renvoie la suite des largeurs (en modules) : barre, espace, barre… en commençant par une barre.
 */
const PATTERNS = [
  "212222", "222122", "222221", "121223", "121322", "131222", "122213", "122312", "132212", "221213",
  "221312", "231212", "112232", "122132", "122231", "113222", "123122", "123221", "223211", "221132",
  "221231", "213212", "223112", "312131", "311222", "321122", "321221", "312212", "322112", "322211",
  "212123", "212321", "232121", "111323", "131123", "131321", "112313", "132113", "132311", "211313",
  "231113", "231311", "112133", "112331", "132131", "113123", "113321", "133121", "313121", "211331",
  "231131", "213113", "213311", "213131", "311123", "311321", "331121", "312113", "312311", "332111",
  "314111", "221411", "431111", "111224", "111422", "121124", "121421", "141122", "141221", "112214",
  "112412", "122114", "122411", "142112", "142211", "241211", "221114", "413111", "241112", "134111",
  "111242", "121142", "121241", "114212", "124112", "124211", "411212", "421112", "421211", "212141",
  "214121", "412121", "111143", "111341", "131141", "114113", "114311", "411113", "411311", "113141",
  "114131", "311141", "411131", "211412", "211214", "211232",
];
const STOP = "2331112";

export function code128(value: string): number[] {
  const numeric = /^(\d\d)+$/.test(value);
  const codes: number[] = [];
  if (numeric) {
    codes.push(105);
    for (let i = 0; i < value.length; i += 2) codes.push(Number(value.slice(i, i + 2)));
  } else {
    codes.push(104);
    for (const ch of value) {
      const c = ch.charCodeAt(0);
      if (c < 32 || c > 126) throw new Error("Code 128 B : caractère non pris en charge.");
      codes.push(c - 32);
    }
  }
  const check = codes.reduce((sum, c, i) => sum + c * (i === 0 ? 1 : i), 0) % 103;
  codes.push(check);
  return [...codes.map((c) => PATTERNS[c]).join(""), ...STOP].map(Number);
}

/** Largeur totale en modules (zones de silence non comprises). */
export const code128Width = (widths: number[]) => widths.reduce((a, b) => a + b, 0);

/** Code-barres en SVG (affichage dans l'administration). */
export function code128Svg(value: string, height = 40, quiet = 10) {
  const w = code128(value);
  const total = code128Width(w) + quiet * 2;
  let x = quiet;
  const bars: string[] = [];
  w.forEach((n, i) => {
    if (i % 2 === 0) bars.push(`<rect x="${x}" y="0" width="${n}" height="${height}"/>`);
    x += n;
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${total} ${height}" preserveAspectRatio="none" shape-rendering="crispEdges"><rect width="${total}" height="${height}" fill="#fff"/><g fill="#000">${bars.join("")}</g></svg>`;
}
